import unittest
from unittest.mock import Mock, patch
import data_conversion

class TestDataConversion(unittest.TestCase):

    @patch('data_conversion.firebase_admin')
    @patch('data_conversion.db.collection')
    def test_format_training_data_for_fine_tuning(self, mock_collection, mock_firebase_admin):
        # Setup: mock firestore doc stream to return mock docs
        mock_docs = [
            Mock(to_dict=lambda: {'Title': 'Test Title 1', 'Content': 'Test Content 1'}),
            Mock(to_dict=lambda: {'Title': 'Test Title 2', 'Content': 'Test Content 2'}),
        ]
        mock_collection.return_value.document.return_value.collection.return_value.stream.return_value = mock_docs

        # Action: call function under test
        user_id = 'test_user_id'
        result = data_conversion.format_training_data_for_fine_tuning(user_id)

        # Assert: check if result is in the correct format (OPEN AI Finetuning JSONL format)
        expected_result = [
            {"messages": [{"role": "user", "content": "Test Title 1"}, {"role": "assistant", "content": "Test Content 1"}]},
            {"messages": [{"role": "user", "content": "Test Title 2"}, {"role": "assistant", "content": "Test Content 2"}]}
        ]
        self.assertEqual(result, expected_result)

if __name__ == '__main__':
    unittest.main()
