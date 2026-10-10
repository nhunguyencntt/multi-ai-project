import os

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    files = {
        'OpenAI Plan': os.path.join(base, 'openai_plain', 'plan.txt'),
        'Claude Code': os.path.join(base, 'claude_vibe', 'main.py'),
        'ChatGPT DB': os.path.join(base, 'chatgpt_database', 'schema.sql'),
        'Gemini Test': os.path.join(base, 'gemini_tester', 'test_main.py'),
    }

    print('=== Antigravity Summary ===')
    for name, path in files.items():
        print(f'--- {name} ---')
        if os.path.exists(path):
            print(read_file(path))
        else:
            print('File not found')
        print()

if __name__ == '__main__':
    main()
