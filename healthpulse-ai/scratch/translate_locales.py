import json
import os
import time
from deep_translator import GoogleTranslator

# The target languages (based on SUPPORTED_LANGUAGES)
targets = ['ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'pa', 'ur', 'fr', 'de', 'zh-CN', 'ja', 'ar', 'pt']
# Deep translator uses "zh-CN" for Chinese, we save it as "zh.json"

def translate_dict(d, translator):
    translated_d = {}
    for k, v in d.items():
        if isinstance(v, dict):
            translated_d[k] = translate_dict(v, translator)
        else:
            try:
                if '{{' in v and '}}' in v:
                    # Skip translating strings with {{variables}} for safety or just keep them?
                    # Let's translate it but Google might break the variable. Better to leave it or carefully replace.
                    # As a hack, replacing it before translation might work.
                    translated_d[k] = v # Let's just leave it unchanged to be safe
                else:
                    res = translator.translate(v)
                    translated_d[k] = res
                    time.sleep(0.5) # avoid rate limit
            except Exception as e:
                print(f"Error translating {v}: {e}")
                translated_d[k] = v
    return translated_d

with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

for lang in targets:
    file_lang = 'zh' if lang == 'zh-CN' else lang
    filepath = f'src/locales/{file_lang}.json'
    
    print(f"Translating to {lang}...")
    try:
        translator = GoogleTranslator(source='en', target=lang)
        translated = translate_dict(en_data, translator)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(translated, f, ensure_ascii=False, indent=2)
        print(f"Saved {filepath}")
    except Exception as e:
        print(f"Failed to translate to {lang}: {e}")
