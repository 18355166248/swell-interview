import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('curate', ROOT / '.agents/skills/swell-interview-curation/scripts/curate.py')
curate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(curate)

class CurationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.questions = json.loads((ROOT / 'src/data/questions.json').read_text())
        cls.sources = json.loads((ROOT / 'src/data/interview-sources.json').read_text())
        cls.batch = json.loads((ROOT / 'content/curation/updates/2026-11-01-nowcoder.json').read_text())
        cls.new = next(c['question'] for c in cls.batch['changes'] if c['action'] == 'add')

    def test_current_bank_has_valid_sources_and_ids(self):
        curate.validate(self.questions, self.sources)

    def test_merge_preserves_id_answer_and_code(self):
        original = next(q for q in self.questions if q['id'] == 'react-effect')
        batch = {'version': 1, 'changes': [{'action': 'merge', 'id': original['id'], 'appendPoints': ['新增边界说明'], 'interviews': [], 'aliases': []}]}
        result, _ = curate.plan(self.questions, batch, self.sources)
        updated = next(q for q in result if q['id'] == original['id'])
        for key in ['id', 'answer', 'code']:
            self.assertEqual(updated.get(key), original.get(key))
        self.assertIn('新增边界说明', updated['points'])

    def test_same_canonical_key_cannot_be_duplicated(self):
        q = copy.deepcopy(self.questions[0]); q['id'] = 'different-id'; q['title'] = '换一种标题'; q['canonicalKey'] = self.questions[0].get('canonicalKey', self.questions[0]['id'])
        with self.assertRaises(ValueError): curate.validate(self.questions + [q], self.sources)

    def test_punctuation_change_is_still_duplicate_title(self):
        q = copy.deepcopy(self.questions[0]); q['id'] = 'other-id'; q['canonicalKey'] = 'other-key'; q['title'] += '？！'
        with self.assertRaises(ValueError): curate.validate(self.questions + [q], self.sources)

    def test_unknown_interview_source_is_rejected(self):
        q = copy.deepcopy(self.questions[0]); q['interviews'] = [{'sourceId': 'missing', 'locator': '第一题'}]
        with self.assertRaises(ValueError): curate.validate([q], self.sources)

    def test_alias_collision_is_rejected(self):
        q = copy.deepcopy(self.questions[0]); q['aliases'] = [self.questions[1]['title']]
        with self.assertRaises(ValueError): curate.validate([q, self.questions[1]], self.sources)

    def test_repeat_add_is_rejected(self):
        if any(q['id'] == self.new['id'] for q in self.questions):
            with self.assertRaises(ValueError): curate.plan(self.questions, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)
        else:
            result, _ = curate.plan(self.questions, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)
            with self.assertRaises(ValueError): curate.plan(result, {'version': 1, 'changes': [{'action': 'add', 'question': self.new}]}, self.sources)

    def test_tracking_parameters_removed_without_losing_document_anchor(self):
        self.assertEqual(curate.canonical_url('https://example.com/a?sourceSSR=search&lang=zh&utm_source=x#api'), 'https://example.com/a?lang=zh#api')

if __name__ == '__main__': unittest.main()
