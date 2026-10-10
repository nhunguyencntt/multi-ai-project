import unittest
from claude_vibe.main import hello

class TestHello(unittest.TestCase):
    def test_output(self):
        self.assertEqual(hello(), None)

if __name__ == '__main__':
    unittest.main()
