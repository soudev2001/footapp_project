"""
billing_service.py — Stripe payments + PDF invoice generation for FootLogic clubs.

Relies on:
  - STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET in app config
  - reportlab (pip install reportlab) for PDF generation
  - MongoDB collection: invoices
"""

from __future__ import annotations

import io
from datetime import datetime

from bson import ObjectId
from flask import current_app

from app.models import create_invoice


class BillingService:
    def __init__(self, db):
        self.db = db
        self.invoices = db.invoices

    # -------------------------------------------------------------------
    # Stripe helpers
    # -------------------------------------------------------------------

    def _stripe(self):
        """Return configured stripe module (lazy import)."""
        try:
            import stripe  # noqa: PLC0415
        except ImportError:
            raise RuntimeError("stripe package is not installed. Run: pip install stripe==7.0.0")
        stripe.api_key = current_app.config.get('STRIPE_SECRET_KEY', '')
        if not stripe.api_key:
            raise RuntimeError("STRIPE_SECRET_KEY is not configured.")
        return stripe

    # -------------------------------------------------------------------
    # Checkout
    # -------------------------------------------------------------------

    def create_checkout_session(self, club_id: str, plan_name: str,
                                amount_cents: int, currency: str = 'eur',
                                success_url: str = '', cancel_url: str = '') -> dict:
        """
        Create a Stripe Checkout Session.
        Returns {'session_id': ..., 'url': ...}
        """
        stripe = self._stripe()

        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': currency,
                    'product_data': {'name': plan_name},
                    'unit_amount': amount_cents,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url or 'http://localhost:5000/admin/billing?status=success',
            cancel_url=cancel_url  or 'http://localhost:5000/admin/billing?status=cancel',
            metadata={'club_id': str(club_id)},
        )

        # Persist a pending invoice
        doc = create_invoice(
            club_id=club_id,
            amount_cents=amount_cents,
            currency=currency,
            plan_name=plan_name,
            status='pending',
            stripe_payment_intent_id=session.payment_intent,
        )
        doc['stripe_session_id'] = session.id
        self.invoices.insert_one(doc)

        return {'session_id': session.id, 'url': session.url}

    # -------------------------------------------------------------------
    # Webhook
    # -------------------------------------------------------------------

    def handle_webhook(self, payload: bytes, sig_header: str) -> tuple[str, int]:
        """
        Process a Stripe webhook event.
        Should be called from a route that is NOT behind @login_required.
        Returns (message, http_status) tuple.
        """
        stripe = self._stripe()
        webhook_secret = current_app.config.get('STRIPE_WEBHOOK_SECRET', '')
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except stripe.error.SignatureVerificationError:
            return 'Invalid signature', 400
        except Exception as exc:
            current_app.logger.error("Webhook parse error: %s", exc)
            return 'Bad payload', 400

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            club_id  = session.get('metadata', {}).get('club_id')
            pi_id    = session.get('payment_intent')

            self.invoices.update_one(
                {'stripe_payment_intent_id': pi_id},
                {'$set': {'status': 'paid', 'paid_at': datetime.utcnow()}}
            )
            # Optionally update club subscription status
            if club_id:
                self.db.clubs.update_one(
                    {'_id': ObjectId(club_id)},
                    {'$set': {'subscription.status': 'active', 'subscription.last_payment': datetime.utcnow()}}
                )

        elif event['type'] == 'payment_intent.payment_failed':
            pi = event['data']['object']
            self.invoices.update_one(
                {'stripe_payment_intent_id': pi['id']},
                {'$set': {'status': 'failed'}}
            )

        return 'OK', 200

    # -------------------------------------------------------------------
    # Invoice history
    # -------------------------------------------------------------------

    def get_invoices(self, club_id: str, limit: int = 50) -> list[dict]:
        """Return sorted invoice history for a club."""
        docs = list(
            self.invoices.find({'club_id': ObjectId(club_id)})
                         .sort('created_at', -1)
                         .limit(limit)
        )
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs

    def get_billing_dashboard(self, club_id: str) -> dict:
        """Aggregate KPIs for the billing dashboard."""
        invoices = self.get_invoices(club_id)
        paid     = [i for i in invoices if i.get('status') == 'paid']
        total_paid_cents = sum(i['amount_cents'] for i in paid)
        last_invoice = paid[0] if paid else None
        club = self.db.clubs.find_one({'_id': ObjectId(club_id)}) or {}

        return {
            'invoices': invoices,
            'total_paid_eur': total_paid_cents / 100,
            'paid_count': len(paid),
            'last_invoice': last_invoice,
            'stripe_publishable_key': current_app.config.get('STRIPE_PUBLISHABLE_KEY', ''),
            'subscription': club.get('subscription', {}),
        }

    # -------------------------------------------------------------------
    # PDF invoice
    # -------------------------------------------------------------------

    def generate_invoice_pdf(self, invoice_id: str) -> bytes | None:
        """Generate a PDF for a single invoice. Returns bytes or None."""
        doc = self.invoices.find_one({'_id': ObjectId(invoice_id)})
        if not doc:
            return None

        club = self.db.clubs.find_one({'_id': doc['club_id']}) or {}

        try:
            from reportlab.lib import colors as rl_colors        # noqa: PLC0415
            from reportlab.lib.pagesizes import A4               # noqa: PLC0415
            from reportlab.lib.styles import getSampleStyleSheet  # noqa: PLC0415
            from reportlab.lib.units import cm                    # noqa: PLC0415
            from reportlab.platypus import (                      # noqa: PLC0415
                SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            )
        except ImportError:
            current_app.logger.warning("reportlab not installed; cannot generate PDF.")
            return None

        buffer = io.BytesIO()
        pdf = SimpleDocTemplate(buffer, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph("<b>FACTURE</b>", styles['Title']))
        elements.append(Spacer(1, 0.4*cm))

        # Club info
        club_name = club.get('name', '—')
        inv_date  = doc.get('created_at', datetime.utcnow()).strftime('%d/%m/%Y')
        paid_date = doc.get('paid_at')
        paid_str  = paid_date.strftime('%d/%m/%Y') if paid_date else '—'

        meta = [
            ['Club', club_name],
            ['N° Facture', str(doc['_id'])[-8:].upper()],
            ['Date d\'émission', inv_date],
            ['Date de paiement', paid_str],
            ['Statut', doc.get('status', '—').upper()],
        ]
        meta_table = Table(meta, colWidths=[5*cm, 10*cm])
        meta_table.setStyle(TableStyle([
            ('FONTNAME',  (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE',  (0, 0), (-1, -1), 10),
            ('FONTNAME',  (0, 0), (0, -1), 'Helvetica-Bold'),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [rl_colors.whitesmoke, rl_colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, rl_colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 0.8*cm))

        # Line items
        amount_eur = doc['amount_cents'] / 100
        currency   = doc.get('currency', 'eur').upper()
        items = [
            ['Description', 'Quantité', 'Montant'],
            [doc.get('plan_name', 'Abonnement FootLogic'), '1', f"{amount_eur:.2f} {currency}"],
        ]
        items_table = Table(items, colWidths=[9*cm, 3*cm, 5*cm])
        items_table.setStyle(TableStyle([
            ('FONTNAME',    (0, 0), (-1, 0),  'Helvetica-Bold'),
            ('FONTSIZE',    (0, 0), (-1, -1), 10),
            ('BACKGROUND',  (0, 0), (-1, 0),  rl_colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR',   (0, 0), (-1, 0),  rl_colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [rl_colors.white, rl_colors.whitesmoke]),
            ('GRID', (0, 0), (-1, -1), 0.5, rl_colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.4*cm))

        # Total
        total_table = Table([['TOTAL', f"{amount_eur:.2f} {currency}"]], colWidths=[12*cm, 5*cm])
        total_table.setStyle(TableStyle([
            ('FONTNAME',   (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE',   (0, 0), (-1, -1), 12),
            ('BACKGROUND', (0, 0), (-1, -1), rl_colors.HexColor('#0f172a')),
            ('TEXTCOLOR',  (0, 0), (-1, -1), rl_colors.white),
            ('PADDING',    (0, 0), (-1, -1), 10),
        ]))
        elements.append(total_table)

        pdf.build(elements)
        return buffer.getvalue()
