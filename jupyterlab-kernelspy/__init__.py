
import json
import os.path

HERE = os.path.abspath(os.path.dirname(__file__))

with open(os.path.join(HERE, 'static', 'package.json')) as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        'src': 'static',
        'dest': data['name']
    }]
