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

    summary_path = os.path.join(base, 'antigravity', 'summary.md')
    with open(summary_path, 'w', encoding='utf-8') as out:
        out.write('# Antigravity Summary\n\n')
        for name, path in files.items():
            out.write(f'## {name}\n')
            if os.path.exists(path):
                out.write(read_file(path) + '\n\n')
            else:
                out.write('File not found\n\n')

    print('Summary generated at', summary_path)


if __name__ == '__main__':
    main()
