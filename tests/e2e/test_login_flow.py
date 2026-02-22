import re
import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.e2e


def test_homepage_has_title_and_login_link(page: Page, live_server: str):
    """Homepage should display title and a Connexion link."""
    page.goto(live_server + '/')

    expect(page).to_have_title(re.compile("FootLogic"))

    # Click the "Connexion" link in the nav
    page.get_by_role("link", name="Connexion").first.click()

    expect(page).to_have_url(re.compile(".*login"))


def test_login_page_shows_form(page: Page, live_server: str):
    """Login page should display email and password fields."""
    page.goto(live_server + '/login')

    expect(page.locator('input[name="email"]')).to_be_visible()
    expect(page.locator('input[name="password"]')).to_be_visible()


def test_login_with_invalid_credentials(page: Page, live_server: str):
    """Submitting bad credentials should show error message."""
    page.goto(live_server + '/login')

    page.fill('input[name="email"]', 'wrong@example.com')
    page.fill('input[name="password"]', 'wrongpassword')
    page.click('button[type="submit"]')

    expect(page.locator('body')).to_contain_text('Email ou mot de passe incorrect')
