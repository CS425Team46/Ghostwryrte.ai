import unittest
import json
import os
from data_preprocessing import preprocess_jsonl

class TestPreprocessJsonl(unittest.TestCase):

    def setUp(self):

        self.input_file = 'test_input.jsonl'
        with open(self.input_file, 'w') as f:
            f.write('{"messages": [{"content": "Hello! 😀 This is a test message."}]}\n')
        
    def tearDown(self):

        os.remove(self.input_file)
        os.remove('test_output.jsonl')

    def test_preprocess_jsonl(self):

        preprocess_jsonl(self.input_file, 'test_output.jsonl')


        self.assertTrue(os.path.exists('test_output.jsonl'))

        with open('test_output.jsonl', 'r') as f:
            
            processed_data = json.loads(f.readline())
            self.assertEqual(processed_data['messages'][0]['content'], 'Hello!  This is a test message.')

if __name__ == '__main__':
    unittest.main()
