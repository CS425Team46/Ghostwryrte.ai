import unittest
import json
import os
from format_validation import preprocess_jsonl, num_tokens_from_messages, num_assistant_tokens_from_messages

class TestFormatValidation(unittest.TestCase):

    def setUp(self):

        self.input_file = 'test_input.jsonl'
        with open(self.input_file, 'w') as f:
            
            f.write('{"messages": [{"role": "user", "content": "Hello! This is a test message."}, '
                    '{"role": "assistant", "content": "Sure! I can help with that."}]}\n')

    def tearDown(self):

        os.remove(self.input_file)

    def test_preprocess_jsonl(self):

        preprocess_jsonl(self.input_file, 'test_output.jsonl')

        self.assertTrue(os.path.exists('test_output.jsonl'))

    def test_num_tokens_from_messages(self):

        with open(self.input_file, 'r') as f:
            dataset = [json.loads(line) for line in f]

        num_tokens = num_tokens_from_messages(dataset[0]['messages'])
        self.assertEqual(num_tokens, 10)  

    def test_num_assistant_tokens_from_messages(self):

        with open(self.input_file, 'r') as f:
            dataset = [json.loads(line) for line in f]


        num_tokens = num_assistant_tokens_from_messages(dataset[0]['messages'])
        self.assertEqual(num_tokens, 5)  

if __name__ == '__main__':
    unittest.main()
