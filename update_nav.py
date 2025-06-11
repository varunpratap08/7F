import os
import re

def update_nav_menu(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Pattern to find the navigation menu section
    pattern = r'(<li class="nav-item">\s*<a class="nav-link" href="contact\.html">\s*Contact\s*</a>\s*</li>)'
    
    # Replacement with the new Blogs link before Contact
    replacement = '''
                                <li class="nav-item">
                                    <a class="nav-link" href="blogs.html">
                                        Blogs
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="contact.html">
                                        Contact
                                    </a>
                                </li>'''
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        return True
    return False

def main():
    html_files = [f for f in os.listdir('.') if f.endswith('.html') and f != 'blogs.html']
    
    for file in html_files:
        try:
            updated = update_nav_menu(file)
            if updated:
                print(f"Updated navigation in {file}")
            else:
                print(f"No changes made to {file}")
        except Exception as e:
            print(f"Error processing {file}: {str(e)}")

if __name__ == "__main__":
    main()
