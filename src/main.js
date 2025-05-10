import './styles/style.css';

tinymce.init({
    selector: '#editor',
    plugins: 'lists',
    readonly: false,
    toolbar: 'bold italic | link | insertTemplate',
    setup: function (editor) {
        editor.ui.registry.addButton('insertTemplate', {
            text: 'insert',
            onAction: function () {
                if (templates.length === 0) return;

                const selectedLi = document.querySelector('#template-list .selected');
                let selectedValue = '';
                if (selectedLi) {
                    selectedValue = selectedLi.textContent.trim();
                }

                const optionsHTML = templates.map(t => {
                    const selectedAttr = t === selectedValue ? ' selected' : '';
                    return `<option value="${t}"${selectedAttr}>${t}</option>`;
                }).join('');

                const selectHTML = `
            <select class="special-component">
                <option value="" data-empty="true"></option>
                ${optionsHTML}
            </select>&nbsp;`;

                tinymce.activeEditor.execCommand('mceInsertContent', false, selectHTML);
            }
        });


        editor.on('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                const node = editor.selection.getNode();
                if (node && node.nodeName === 'SELECT') {
                    e.preventDefault();
                    node.remove();
                }
            }
        });

        editor.on('blur', () => {
            removeUnusedErrorOptions();
        });
    }
});

const insertButton = document.getElementById('insert-button');
const templateList = document.getElementById('template-list');
const templateInput = document.getElementById('template-input');
const addTemplateButton = document.getElementById('add-template');
const removeTemplateButton = document.getElementById('remove-template');

let templates = ['template 1', 'template 2', 'template 3'];
let selectedTemplateIndex = null;

function renderTemplates() {
    templateList.innerHTML = '';
    templates.forEach((template, index) => {
        const li = document.createElement('li');
        li.textContent = template;
        li.dataset.index = index;
        if (index === selectedTemplateIndex) {
            li.classList.add('selected');
        }
        templateList.appendChild(li);
    });
}

templateList.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        selectedTemplateIndex = parseInt(e.target.dataset.index, 10);
        templateInput.value = templates[selectedTemplateIndex];
        renderTemplates();
    }
});

addTemplateButton.addEventListener('click', () => {
    const newTemplate = `template`;
    templates.push(newTemplate);
    selectedTemplateIndex = templates.length - 1;
    renderTemplates();
    templateInput.value = newTemplate;
    updateEditorComponents();
});

removeTemplateButton.addEventListener('click', () => {
    if (selectedTemplateIndex !== null) {
        const removedTemplate = templates[selectedTemplateIndex];
        templates.splice(selectedTemplateIndex, 1);
        selectedTemplateIndex = null;
        renderTemplates();
        templateInput.value = '';
        updateEditorComponents(removedTemplate);
    }
});

templateInput.addEventListener('blur', () => {
    if (selectedTemplateIndex !== null) {
        const oldTemplate = templates[selectedTemplateIndex];
        const newTemplate = templateInput.value.trim();

        if (oldTemplate !== newTemplate) {
            templates[selectedTemplateIndex] = newTemplate;
            renderTemplates();

            // Обновляем компоненты редактора
            updateEditorComponents(oldTemplate, newTemplate);
        }
    }
});

function setErrorOption(select) {
    // Удаляем старую ошибочную опцию, если есть
    const existingError = select.querySelector('option[value="__ERROR__"]');
    if (existingError) existingError.remove();

    // Создаём и добавляем новую ошибочную опцию
    const errorOption = document.createElement('option');
    errorOption.value = '__ERROR__';
    errorOption.textContent = 'ERROR';
    errorOption.dataset.error = 'true';
    select.appendChild(errorOption);

    // Устанавливаем её как выбранную
    select.value = '__ERROR__';
}

function updateEditorComponents(oldTemplate = null, newTemplate = null) {
    console.log("Updating editor components...");
    const body = tinymce.activeEditor.getBody();
    const selects = body.querySelectorAll('select.special-component');

    selects.forEach((select) => {
        const currentValue = select.value;

        let matched = false;
        const optionsToAdd = [];

        templates.forEach((template) => {
            const option = document.createElement('option');
            option.value = template;
            option.textContent = template;
            optionsToAdd.push(option);

            if (template === currentValue || template === newTemplate) {
                matched = true;
            }
        });

        // Очистка и восстановление опций
        select.innerHTML = '';

        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        emptyOption.dataset.empty = 'true';
        select.appendChild(emptyOption);

        optionsToAdd.forEach(option => {
            select.appendChild(option);
        });

        // Логика восстановления выбранного значения
        if (currentValue === '') {
            select.value = '';
        } else if (templates.includes(currentValue)) {
            select.value = currentValue;
        } else if (newTemplate && templates.includes(newTemplate)) {
            select.value = newTemplate;
        }

        if (!matched && currentValue !== '') {
            setErrorOption(select);
            console.log("ERROR option added and selected due to unmatched template");
        }

        // Удаление ERROR после корректного выбора
        select.addEventListener('change', () => {
            if (select.value !== '' && select.value !== '__ERROR__') {
                const errorOption = select.querySelector('option[value="__ERROR__"]');
                if (errorOption) {
                    errorOption.remove();
                    console.log("ERROR option removed after valid selection");
                }
            }
        });
    });
}

function removeUnusedErrorOptions() {
    const body = tinymce.activeEditor.getBody();
    const selects = body.querySelectorAll('select.special-component');

    selects.forEach((select) => {
        const errorOption = select.querySelector('option[value=""]');
        if (errorOption && select.value !== '' && select.value !== 'ERROR') {
            errorOption.remove();
        }
    });
}

if (insertButton) {
    insertButton.addEventListener('click', () => {
        if (templates.length === 0) return;

        // Создаем пустой элемент по умолчанию
        const emptyTemplate = ''; // Пустой шаблон, который можно будет выбрать
        const optionsHTML = templates.map(t => `<option value="${t}">${t}</option>`).join('');

        const selectHTML = `
        <select class="special-component">
            <option value="" data-empty="true">${emptyTemplate}</option>
            ${optionsHTML}
        </select>&nbsp;`;

        tinymce.activeEditor.execCommand('mceInsertContent', false, selectHTML);
    });
}

renderTemplates();
