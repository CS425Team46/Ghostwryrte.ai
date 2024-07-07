import unittest
from unittest.mock import patch, MagicMock
import sys
from io import StringIO
import json

from model_training import start_model_training, check_finetuning_job_status

class TestModelTraining(unittest.TestCase):

    @patch('model_training.db')
    @patch('model_training.client')
    def test_start_model_training(self, mock_client, mock_db):

        user_ref_mock = MagicMock()
        user_ref_mock.get.return_value.exists = True
        user_ref_mock.to_dict.return_value = {'latest_file_id': 'some_file_id'}
        mock_db.collection.return_value.document.return_value = user_ref_mock

        mock_job_response = MagicMock()
        mock_job_response.id = 'fake_job_id'
        mock_client.fine_tuning.jobs.create.return_value = mock_job_response

        user_id = 'fake_user_id'
        result = start_model_training(user_id)

        self.assertEqual(result['message'], 'Model training started successfully')
        self.assertEqual(result['job_id'], 'fake_job_id')

    @patch('model_training.client')
    @patch('model_training.time.sleep')
    @patch('model_training.logging')

    def test_check_finetuning_job_status(self, mock_logging, mock_sleep, mock_client):

        mock_job_status = MagicMock()
        mock_job_status.status = 'succeeded'
        mock_job_status.fine_tuned_model = 'fake_model_id'
        mock_client.fine_tuning.jobs.retrieve.return_value = mock_job_status

        mock_user_ref = MagicMock()
        mock_db_instance = MagicMock()
        mock_db_instance.collection.return_value.document.return_value = mock_user_ref
        with patch('model_training.db', mock_db_instance):
            status = check_finetuning_job_status('fake_job_id', 'fake_user_id')

        self.assertEqual(status['message'], 'Model training completed successfully')
        self.assertEqual(status['model_id'], 'fake_model_id')
        mock_logging.info.assert_called_once()
        mock_user_ref.update.assert_called_once()

if __name__ == '__main__':
    unittest.main()
