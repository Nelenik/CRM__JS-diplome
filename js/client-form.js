function createHtml(options) {
  const tag = document.createElement(options.tagName);
  if (options.classes) tag.classList.add(...options.classes);
  if (options.attributes) {
    for (let key in options.attributes) {
      tag.setAttribute(key, options.attributes[key]);
    }
  }
  if (options.text) tag.textContent = options.text;
  if (options.inner) tag.innerHTML = options.inner;
  if (options.value) tag.value = options.value;
  return tag;
}

let editForm;
let validation;
// функция создания формы
function createForm({ onSave, onEdit, onDelete }, client) {
  editForm = client ? true : false;
  const formEl = createHtml({
    tagName: 'form',
    classes: [editForm ? 'edit-client-form' : 'add-client-form', 'form'],
    attributes: { name: editForm ? 'editForm' : 'addForm', autocomplete: 'off', formnovalidate: '' }

  })
  const formTitleEl = createHtml({
    tagName: 'h2',
    classes: ['form__title'],
    attributes: { id: editForm ? 'editClForm' : 'newClForm' },
    inner: editForm ? `Изменить данные <span class="text--grey title-id">ID: ${client.id}</span>` : 'Новый клиент',
  })
  const closeBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'form__close-btn', 'modal-close'],
    attributes: { type: 'button', name: 'closeBtn' },
    inner: '╳'
  })
  // создаем поля ввода
  const inputBlocks = []
  const inputs = [
    createHtml({
      tagName: 'input',
      classes: ['form__input', 'surname-input'],
      attributes: { name: 'surname', type: 'text' },
      value: editForm ? formatStr(client.surname) : ''
    }),
    createHtml({
      tagName: 'input',
      classes: ['form__input', 'name-input'],
      attributes: { name: 'name', type: 'text' },
      value: editForm ? formatStr(client.name) : ''
    }),
    createHtml({
      tagName: 'input',
      classes: ['form__input', 'lastname-input'],
      attributes: { name: 'lastName', type: 'text' },
      value: editForm ? formatStr(client.lastName) : ''
    })
  ]
  // создаем label для полей ввода
  const labelsText = [`Фамилия`, 'Имя', 'Отчество']
  for (let i = 0; i < labelsText.length; i++) {
    const label = createHtml({
      tagName: 'label',
      classes: ['form__label'],
      inner: `<span class="form__input-placeholder">${labelsText[i]}</span>`
      // text: editForm ? labelsText[i] : '',
    })
    label.prepend(inputs[i]);
    inputBlocks.push(label)
  }
  for (const input of inputs) {
    const placeholder = input.nextElementSibling;
    if (input.value) {
      placeholder.classList.add('filled-input-value')
    }
    input.addEventListener('input', function (e) {
      if (input.value) placeholder.classList.add('filled-input-value')
    })
    input.addEventListener('blur', function (e) {
      if (!input.value) {
        placeholder.classList.remove('filled-input-value')
      }

    })

  }
  // создаем блок с контактами
  const contactsWrap = createHtml({
    tagName: 'div',
    classes: ['contacts-wrap'],
  })
  const contactsGroup = createHtml({
    tagName: 'div',
    classes: ['contacts-group'],
  })
  const addContactBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'contacts-group__add-btn'],
    attributes: { type: 'button', name: 'addContactBtn' },
    inner: `<svg width="16" height="16">
    <use xlink:href="icons.svg#add-contact"></use>
    </svg> Добавить контакт`
  })
  // валидация с just-validate plugin
  validation = new JustValidate(formEl, {

  })
  validation
    .addField(inputs[0], [
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'Минимум 3 символа'
      }, {
        rule: 'maxLength',
        value: 30,
        errorMessage: 'Максимум 3 символа'
      }, {
        rule: 'customRegexp',
        value: /^[a-zA-zа-яёА-ЯЁ]+$/,
        errorMessage: 'Недопустимые символы'
      }, {
        rule: 'required',
        errorMessage: 'Обязательное поле'
      }
    ])
    .addField(inputs[1], [
      {
        rule: 'minLength',
        value: 3,
        errorMessage: 'Минимум 3 символа'
      }, {
        rule: 'maxLength',
        value: 30,
        errorMessage: 'Максимум 3 символа'
      }, {
        rule: 'customRegexp',
        value: /^[a-zA-zа-яёА-ЯЁ]+$/,
        errorMessage: 'Недопустимые символы'
      }, {
        rule: 'required',
        errorMessage: 'Обязательное поле'
      }
    ])
    .addField(inputs[2], [
      {
        rule: 'customRegexp',
        value: /^[a-zA-zа-яёА-ЯЁ]+$/,
        errorMessage: 'Недопустимые символы'
      }
    ])
    .onSuccess((e) => {
      editForm ? editSubmitHandler(e.target, onEdit, client.id) : saveSubmitHandler(e.target, onSave)
    })

  // добавляем существующие в б/д контакты
  let contactsArr = [];
  if (editForm) {
    let contacts = client.contacts;
    if (contacts.length) {
      for (const el of contacts) {
        contactsArr.push(createSingleContact({ type: el.type, value: el.value }));
      }
    }
  }

  checkContactsCount(contactsArr.length, addContactBtn);

  const submitBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'form__submit-btn',],
    attributes: { type: 'submit', name: editForm ? 'saveEdited' : 'saveNew' },
    text: 'Сохранить',
  })

  const cancelOrDelBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', editForm ? 'form__delete-btn' : 'form__cancel-btn'],
    attributes: { type: 'button', name: editForm ? "formDeleteBtn" : "formCancelBtn" },
    text: editForm ? 'Удалить клиента' : 'Отмена',
  })

  contactsGroup.append(...contactsArr);
  contactsWrap.append(contactsGroup, addContactBtn)
  formEl.append(formTitleEl, closeBtn, ...inputBlocks, contactsWrap, submitBtn, cancelOrDelBtn)

  // обработчик для кнопок добавить и удалить контакт
  const addDelContactListener = addDelContactHandler(contactsGroup, addContactBtn)
  document.addEventListener('click', addDelContactListener)

  // при закрытии модалки сбрасывается валидация и ненужные обработчики
  document.addEventListener('modalOnClose', function resetValidation(e) {
    validation.refresh();
    document.removeEventListener('click', addDelContactListener)
    document.removeEventListener('modalOnClose', resetValidation)

  })

  // обработчики кнопок формы удаления клиента/отмены
  cancelOrDelBtn.addEventListener('click', editForm ? deleteClientHandler(onDelete, client.id) : cancelClientHandler)
  return formEl
}

// ф-я создает один контакт
function createSingleContact(contactDataObj) {
  let selected = 'Телефон';
  let contactVal = '';
  // если в ф-ю передается аргумент то в selected записываем существующие данные
  if (contactDataObj) {
    ['Телефон', 'Email', 'Vk', 'Facebook'].includes(contactDataObj.type) ? selected = contactDataObj.type : selected = 'Доп. контакт';
    contactVal = contactDataObj.value
  }

  const contactSingle = createHtml({
    tagName: 'fieldset',
    classes: ['contact-single'],
    attributes: { name: 'contactSingle' },
  })

  const selectWrapper = createHtml({
    tagName: 'label',
    classes: ['contact-single__type', 'type'],
  })

  const select = createHtml({
    tagName: 'select',
    attributes: { name: "contactType" },
    inner: `<option value="Телефон">Телефон</option>
            <option value="Доп. контакт">Доп. контакт</option>
            <option value="Email">Email</option>
            <option value="Vk">Vk</option>
            <option value="Facebook">Facebook</option>`,
    value: selected,
  })

  // устанавливаем значение атрибута type инпута по вводу значения контакта
  let inputType = selected === 'Телефон' ? 'tel' : selected === 'Email' ? 'email' : 'text'
  const valueInput = createHtml({
    tagName: 'input',
    classes: ['contact-single__value-input'],
    attributes: { type: inputType, name: 'contactValue', placeholder: 'Введите данные контакта' },
    value: contactVal,
  })

  // маска на телефон(плагин Inputmask)
  if (inputType === 'tel') setMask(valueInput)

  const deleteContactBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'contact-single__delete-btn'],
    attributes: { type: 'button', name: 'deleteContactBtn', 'aria-label': 'Удалить контакт' },
    inner: `<svg width="16" height="16">
    <use xlink:href="icons.svg#delete"></use>
    </svg>`
  })

  selectWrapper.append(select);
  contactSingle.append(selectWrapper, valueInput, deleteContactBtn);

  // добавляем поле валидации для контакта(just-validate plugin)
  validation.addField(valueInput, [
    {
      rule: 'required',
      errorMessage: 'Заполните поле контакта'
    }
  ])

  // choices plugin
  const customSelect = new Choices(select, {
    shouldSort: false,
    itemSelectText: '',
    searchEnabled: false,
    // addItems: true,
  })

  //обработчик назначает type и маску полю значения контакта, добавляет доп.инпут для дополнительного контакта.
  select.addEventListener('change', function (e) {
    // в зависимости от выбранного значения селекта меняется тип соседнего инпута
    this.value === 'Телефон' ? setInputType(this, 'tel') :
      this.value === 'Email' ? setInputType(this, 'email') :
        setInputType(this, 'text');
    if (this.value === 'Доп. контакт') {
      // создаем доп инпут для типа контактов
      let additInput = createHtml({
        tagName: 'input',
        classes: ['additional-contact-type'],
        attributes: { type: 'text', name: 'additContactType' },
      })
      selectWrapper.append(additInput);
      let addValue;
      // обработчик добавляет в селект доп контакт с задержкой 700ms, после чего удаляет доп инпут
      additInput.addEventListener('input', function (e) {
        addValue = this.value
        this.onblur = () => {
          customSelect.setValue([addValue]), this.remove()
        }
      })
      // обработчки удаляет инпут при клике вне него
      document.addEventListener('click', function (e) {
        const input = selectWrapper.querySelector('.additional-contact-type')
        if (input && !(e.target === input)) input.remove()
      })
    }
  })
  return contactSingle
}

// ф-ция настраивает тип инпута ввода значения контакта
function setInputType(el, type) {
  const valueInput = el.closest('fieldset').elements.contactValue
  valueInput.setAttribute('type', `${type}`);
  if (type == 'tel') {
    setMask(valueInput)
  } else if (valueInput.inputmask) {
    valueInput.inputmask.remove()
  }
}

// настраивает маску телефона на соотв.инпут(плагин Inputmask)
function setMask(input) {
  Inputmask({ "mask": "+9 (999) 999-99-99", 'autoUnmask': true }).mask(input)
}

// проверяет количество контактов и прячет/показывает кнопку добавления контакта
function checkContactsCount(count, btn) {
  let max = 10;
  count >= max ? btn.hidden = true : btn.hidden = false;
}
// обработчик кнопок удалить/добавить контакт
function addDelContactHandler(contactsGroup, addContactBtn) {
  return function (e) {
    const existingContacts = contactsGroup.querySelectorAll('.contact-single').length
    let count = existingContacts ? existingContacts : 0
    if (e.target.closest('.contacts-group__add-btn') === addContactBtn) {
      let singleContact = createSingleContact()
      contactsGroup.append(singleContact)
      singleContact.querySelector('.choices').focus()
      count++;
      checkContactsCount(count, e.target)
    }
    const delBtn = e.target.closest('.contact-single__delete-btn');
    if (delBtn) {
      count--;
      checkContactsCount(count, addContactBtn)
      const contactToDel = e.target.closest('.contact-single');
      validation.removeField(contactToDel.elements.contactValue);
      contactToDel.remove()
    }
  }
}
// ф-я формирование объекта с данными клиента
function formClientObj(form) {
  let contacts = [];
  const fields = form.querySelectorAll('.contact-single')
  for (let el of fields) {
    let elems = el.elements;
    contacts.push({ type: formatStr(elems.contactType.value), value: elems.contactValue.value })
  }

  const clientData = {
    name: formatStr(form.name.value),
    surname: formatStr(form.surname.value),
    lastName: formatStr(form.lastName.value),
    contacts
  }
  return clientData
}
// обработчик изменения данных о клиенте
function editSubmitHandler(form, onEdit, clientId) {
  let clientData = formClientObj(form)
  onEdit(clientData, clientId, form)
}
// обработчик сохранения нового клиента
function saveSubmitHandler(form, onSave) {
  let clientData = formClientObj(form)
  onSave(clientData, form)
}

// обработчик кнопки удаления в форме редактирования
function deleteClientHandler(onDelete, clientId) {
  return function (e) {
    onDelete(clientId, this);
  }
}
// обработчик кнопки отмены
function cancelClientHandler(e) {
  this.closest('.modal-open').click()
}
// форматирование строки возвращает строку с заглавной буквы
function formatStr(str) {
  let trimmed = str.trim();
  if (trimmed) {
    return trimmed[0].toUpperCase() + trimmed.slice(1);
  }
  return trimmed
}

window.createForm = createForm
