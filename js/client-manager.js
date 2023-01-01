let renderData = [];

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
/***** table elems ******/
// cells
function createCells(obj, row, cellName) {
  const objValues = Object.values(obj);
  for (const item of objValues) {
    const cell = createHtml({ tagName: cellName, classes: ['client-cell'] });
    cell.append(...item);
    row.append(cell);
  }
}
// row
function createTableRow(client, tBody) {
  const row = tBody.insertRow();
  row.classList.add('client-row')
  row.setAttribute('id', `${client.id}`);
  createCells(client.toRenderTable, row, 'td')
}
// tBody
function completeTBody() {
  const tBody = document.querySelector('.clients__tbody');
  tBody.innerHTML = '';
  for (const el of renderData) {
    createTableRow(el, tBody);
  }
}
// настройка сортировки
function setTableSorting() {
  const buttons = document.querySelectorAll('[data-sort]');
  for (const btn of buttons) {
    let dir = false;
    if (btn.classList.contains('sorted')) dir = true;
    btn.addEventListener('click', function (e) {
      dir = !dir;
      dir == true ? btn.classList.add('sorted') : btn.classList.remove('sorted');
      renderData.sort(sortBy(dir, btn.dataset.sort));
      completeTBody()
    })
  }
}
// ф-ция сортировки
function sortBy(dir, prop) {
  return (a, b) => {
    a = a[prop];
    b = b[prop];
    if (dir === true ? a < b : a > b) return -1;
  }
}

/****** modal inners *******/
// modal inner for confirm delete
function createDelConfirmInner({ onDelete }, id) {
  const confirmWrap = createHtml({
    tagName: 'div',
    classes: ['confirm'],
    inner: `
    <button class="btn-reset confirm__close-btn modal-close" type="button">╳</button>
    <h2 class="confrim__title">Удалить клиента</h2>
    <p class="confirm__question">Вы действительно хотите удалить данного клиента?</p>`
  });
  const confirmDelBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'confirm__del-btn'],
    attributes: { type: 'button' },
    text: 'Удалить'
  })

  const confirmCancelBtn = createHtml({
    tagName: 'button',
    classes: ['btn-reset', 'confirm__cancel-btn'],
    attributes: { type: 'button' },
    text: 'Отмена',
  })
  // обработчики кнопок
  confirmDelBtn.addEventListener('click', function (e) {
    onDelete(id, this);
  })
  confirmCancelBtn.addEventListener('click', function (e) {
    closeModal(this)
  })

  confirmWrap.append(confirmDelBtn, confirmCancelBtn)
  return confirmWrap
}

// modal inner for client card
function createClientCardInner(clientData) {
  let clientCard = createHtml({
    tagName: 'article',
    classes: ['card'],
    inner: `<h2 class="card__title">${clientData.surname} ${clientData.name} ${clientData.lastName} <span class="card__id">${clientData.id}</span></h2><div class="card__contacts contacts><h3 class="contacts__title">Контакты</h3><ul class="contacts__list"></ul></div>`
  })
  for (const contact of clientData.contacts) {
    let href = contact.type === 'Телефон' ? `tel:${contact.type}` : contact.type === 'Email' ? `mailto:${contact.type}` : contact.type
    let contactEl = createHtml({
      tagName: "li",
      classes: ['contacts__item', 'contact'],
      inner: `<span class="contact__type">${contact.type}:</span> <a class="contact__link" href="${href}">${contact.value}`
    })
    clientCard.querySelector('.contacts__list').append(contactEl)
  }
  return clientCard
}

// функция создает карточку клиента из id из hash url-a
async function showClientCard() {
  if (isBaseUrl()) return
  let id = window.location.hash.slice(1);

  const data = await getAClient(id);
  card = new ModalConstructor('.client-row__link', {
    modalInner: createClientCardInner(data),
    animTime: 400,
    easing: 'linear',
    modalWrapperClass: 'client-card-wrapper',
    afterClose: (e) => {
      console.log(e.target)
      history.pushState(null, null, getBaseUrl())
    }
  })
  card.open()
  return card
}

// функция закрыть модалку (иммитация клика по оверлею модалки)
function closeModal(el) {
  el.closest('.modal-open').click()
}

// функция создания сообщения об ошибке запроса
function createErrorMessage(message, elToPlace) {
  message = message ? message : 'Ой, что-то пошло не так'
  const errorBlock = createHtml({
    tagName: 'div',
    classes: ['error-message'],
    inner: `Ошибка: ${message}`
  })
  elToPlace.before(errorBlock)
}

// фнкция создания индикатора загрузки
function createLoader(size, el) {
  console.log('i am spiner')
  inner = size == 'small' ? `<svg class="loader-spinner-${size}" width="16" height="16" >
  <use xlink:href="icons.svg#load-small"></use>
  </svg>` : `<svg class="loader-spinner-${size}" width="40" height="40" >
  <use xlink:href="icons.svg#load-large"></use>
  </svg>`
  const loader = createHtml({
    tagName: 'div',
    classes: ['loader-overlay'],
    inner: inner
  })
  el.prepend(loader)
  el.style.position = 'relative';
  return loader
}
// функция отключает поля формы
function disableFields(form) {
  for (const el of form.elements) {
    el.disabled = true;
  }
}
// функция включает поля формы
function enableFields(form) {
  for (const el of form.elements) {
    el.disabled = false;
  }
}

// функция получить базовый url
function getBaseUrl() {
  return window.location.protocol + '//' + window.location.host + window.location.pathname;
}
// функция является ли текущий url базовым, boolean
function isBaseUrl() {
  return window.location.href === getBaseUrl()
}

/*******GET requests *******/
// запрос на получение клиентов
async function getClients() {
  renderData = [];
  const response = await fetch(`http://localhost:3000/api/clients`);
  // добавляем спинер при запросе
  const tableWrap = document.querySelector('.table-wrap');
  const loader = createLoader('large', tableWrap);

  if (response.ok) {
    loader.remove();
    const clients = await response.json();
    for (const client of clients) {
      renderData.push(new Client(client))
    }
  }
}

async function getAClient(id, target) {
  const response = await fetch(`http://localhost:3000/api/clients/${id}`);
  let loader;
  if (target) {
    loader = createLoader('small', target)
  }
  const client = await response.json();
  if (response.ok) {
    if (loader) loader.remove();
    return client
  }
}

/******* CLIENT-MANAGER ******/
async function createClientManager() {
  setTableSorting()
  await getClients();
  completeTBody();
  // обработчики запросов(сохранения нового кл, редактирования, удаления)
  const handlers = {
    async onSave(newClientData, form) {
      const response = await fetch(`http://localhost:3000/api/clients`, {
        method: 'POST',
        body: JSON.stringify(newClientData),
        headers: { 'Content-Type': 'application/json' }
      })
      disableFields(form)
      const loader = createLoader('small', form.saveNew);

      const clientObj = await response.json();
      if (response.ok) {
        enableFields(form)
        loader.remove()
        const newClientObj = new Client(clientObj);
        renderData.push(newClientObj);
        const tBody = document.querySelector('.clients__tbody');
        createTableRow(newClientObj, tBody);
        closeModal(form)
      } else {
        for (const error of clientObj.errors) {
          createErrorMessage(error.message, form.saveNew)
        }
      }
    },
    async onEdit(editedClientData, clientId, form) {
      const response = await fetch(`http://localhost:3000/api/clients/${clientId}`, {
        method: 'PATCH',
        body: JSON.stringify(editedClientData),
        headers: { 'Content-Type': 'application/json' }
      })
      disableFields(form)
      const loader = createLoader('small', form.saveEdited)
      let result = await response.json()
      if (response.ok) {
        enableFields(form)
        loader.remove()
        closeModal(form)
        await getClients();
        completeTBody();
      } else {
        for (const error of result.errors) {
          createErrorMessage(error.message, form.saveEdited)
        }
      }
    },
    onDelete(clientId, el) {
      const objToDel = renderData.findIndex(item => item.id === clientId);
      renderData.splice(objToDel, 1);
      const rowToDel = document.querySelector(`[id="${clientId}"]`)
      rowToDel.remove();
      fetch(`http://localhost:3000/api/clients/${clientId}`, {
        method: 'DELETE'
      })
      closeModal(el)
    }
  }

  //modal for new client form
  document.addEventListener('click', function (e) {
    const target = e.target.closest('.new-btn');
    if (!target) return;
    const newCl = new ModalConstructor('.new-btn', {
      modalInner: createForm(handlers),
      animTime: 500,
      modalCloseBtnClass: 'modal-close',
    })
    newCl.open()
  })
  // кастомный обработчик закрытия модалки
  document.addEventListener('modalOnClose', function resetModal(e) {
    if (e.target.name == 'addForm') {
      e.target.reset()
      e.target.querySelector('.contacts-group').innerHTML = ''
    }

    const errors = e.target.querySelectorAll('.error-message');
    if (errors.length) {
      for (const errorEl of errors) errorEl.remove()
    }
    document.removeEventListener('modalOnClose', resetModal)
  })
  // modal for edit client form
  document.addEventListener('click', async function (e) {
    const target = e.target.closest('.client-row__edit-btn');
    if (!target) return;
    const client = await getAClient(target.dataset.id, target)
    const editModal = new ModalConstructor(target, {
      modalInner: createForm(handlers, client),
      animTime: 500,
      modalCloseBtnClass: 'modal-close',
    })
    editModal.open()
  })

  // modal for delete client confirm
  document.addEventListener('click', function (e) {
    const target = e.target.closest('.client-row__delete-btn');
    if (!target) return;
    const confirmDelModal = new ModalConstructor(target, {
      modalInner: createDelConfirmInner(handlers, target.dataset.id),
      animTime: 500,
      modalCloseBtnClass: 'modal-close'
    })
    confirmDelModal.open()
  })
  // изменение url при клике на ссылку
  document.addEventListener('click', function (e) {
    const target = e.target.closest('.client-row__link');
    if (!target) return;
    console.log(target.dataset.id)
    window.location.hash = `${target.dataset.id}`
  })
}

createClientManager()

// открытие карточки при смене hash
let card;
window.addEventListener('hashchange', async function (e) {
  if (isBaseUrl()) {
    card.close()
    history.replaceState(null, null, getBaseUrl())
  }

  card = await showClientCard()
  console.log(card)
})

// открытие карточки при загрузке страницы
window.addEventListener('load',  showClientCard)
