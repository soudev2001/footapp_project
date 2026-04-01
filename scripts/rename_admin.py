import os

files = [
    r'c:\Users\soaniba\AnibaProjects\footapp_project\app\routes\admin.py',
    r'c:\Users\soaniba\AnibaProjects\footapp_project\app\routes\auth.py',
    r'c:\Users\soaniba\AnibaProjects\footapp_project\app\routes\main.py',
    r'c:\Users\soaniba\AnibaProjects\footapp_project\app\templates\components\_sidebar.html'
]
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = content.replace("'admin.admin_panel'", "'admin.dashboard'")
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Done!')
