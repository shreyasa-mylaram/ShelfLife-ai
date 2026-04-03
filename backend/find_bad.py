import ast, os

for root, dirs, files in os.walk('/app'):
    for f in files:
        if not f.endswith('.py'):
            continue
        path = os.path.join(root, f)
        try:
            with open(path) as fh:
                ast.parse(fh.read())
        except SyntaxError as e:
            print(f"SYNTAX ERROR in {path}: {e}")
