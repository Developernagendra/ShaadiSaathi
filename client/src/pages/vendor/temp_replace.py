with open('./VendorManageCabsPage.jsx', 'r') as f:
    code = f.read()

start_tag = '{/* 8-Step Multi-Step Modal */}'
end_tag = '</AnimatePresence>'

start_idx = code.find(start_tag)
if start_idx == -1:
    print('Start tag not found')
    exit(1)

end_idx = code.find(end_tag, start_idx)
if end_idx == -1:
    print('End tag not found')
    exit(1)
end_idx += len(end_tag)

with open('./temp_modal.jsx', 'r') as f:
    modal = f.read()

new_code = code[:start_idx] + modal + '\n    </div>\n  )\n}\n'

with open('./VendorManageCabsPage.jsx', 'w') as f:
    f.write(new_code)

print('Modal replaced successfully')
