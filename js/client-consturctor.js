let uniqueId = 1;
function Client(data) {
  this.id = data.id;
  this.fullName = `${formatStr(data.surname)} ${formatStr(data.name)} ${formatStr(data.lastName)}`;
  this.createdAt = new Date(data.createdAt);
  this.updatedAt = new Date(data.updatedAt);
  this.solidFullName = this.fullName.split(' ').join('').toLowerCase();// полное имя без пробелов в одном регистре для сортировки
  // элементы для рендера таблицы
  this.toRenderTable = {
    idEl: createIdEl(this.id),
    fullNameEl: createFullNameEl(this.fullName, this.id),
    createdAtEl: createDateEl(this.createdAt),
    updatedAtEl: createDateEl(this.updatedAt),
    contactsEl: createContactsBtns(data.contacts),
    actionsEl: createActionsEl(data.id),
  };

  function createIdEl(value) {
    const el = createHtml({
      tagName: 'span',
      classes: ['text', 'text--grey', 'client-row__id'],
      text: value,
    });
    return [el];
  }
  function createFullNameEl(fullName, id) {
    // const href =
    const client = createHtml({
      tagName: 'a',
      classes: ['text', 'client-row__link'],
      attributes: { tabindex: '0', 'data-id': id, target: '_blank'},
      text: fullName
    })
    return [client]
  };

  function createDateEl(dateObj) {
    const formated = formatDate(dateObj);
    const dateCellEl = [];
    for (const [key, value] of Object.entries(formated)) {
      const el = createHtml({
        tagName: 'span',
        classes: key === 'formatedDate' ? ['text', 'client-row__date'] : ['text', 'text--grey', 'client-row__time'],
        text: value
      })
      dateCellEl.push(el)
    }
    return dateCellEl
  }

  function createContactsBtns(contacts) {
    const contactsArr = [];
    for (const contact of contacts) {
      const values = Object.values(contact);
      const checked = checkContact(values);
      const toolTrigger = createHtml({
        tagName: 'button',
        classes: ['btn-reset', 'client-row__contact'],
        attributes: { type: 'button', 'aria-label': `${checked.btnAria}`, 'data-contact-type': values[0], 'data-contact-value': values[1] },
        inner: checked.btnInner,
      });
      // создаем тултип из данных в кнопке контактов
      let tool = new MyTooltip(toolTrigger, {
        makeContent: (trigger) => {
          let contactType = trigger.dataset.contactType;
          let contactValue = trigger.dataset.contactValue;
          let href = contactType === "Телефон" ? `tel:+${contactValue}` : contactType === 'Email' ? `mailto:${contactValue}` : contactValue
          let tippyInner = createHtml({
            tagName: 'span',
            classes: ['contact-text'],
            inner: `${contactType}: <a class="contact-link" href="${href}">${contactValue}</a></span>`
          })
          // маскируем телефон в тултипе
          if (/tel/.test(href)) {
            let selector = tippyInner.querySelector('.contact-link');
            Inputmask({"mask": "+9 (999) 999-99-99"}).mask(selector);
          }
          return tippyInner
        },
        easing: 'ease-in-out',
        triggerEvent: 'focus hover',
        tooltipId: `${uniqueId}`,
      })
      uniqueId++
      contactsArr.push(toolTrigger)
    }
    const contactsWrap = createHtml({
      tagName: 'div',
      classes: ['table-contacts-wrap']
    })
    contactsWrap.append(...contactsArr)
    return [contactsWrap]
  }

  function createActionsEl(id) {
    const editBtn = createHtml({
      tagName: 'button',
      classes: ['btn-reset','text', 'client-row__edit-btn'],
      attributes: { type: 'button', 'data-id': id, 'aria-haspopup': true },
      inner: `<svg width="12" height="12">
      <use xlink:href="icons.svg#edit"></use>
      </svg> Изменить`
    });
    const deletBtn = createHtml({
      tagName: 'button',
      classes: ['btn-reset','text', 'client-row__delete-btn'],
      attributes: { type: 'button', 'data-id': id,  'aria-haspopup': true },
      inner: `<svg width="12" height="12">
      <use xlink:href="icons.svg#delete"></use>
      </svg> Удалить`,
    });
    const btnWrapper = createHtml({
      tagName: 'div',
      classes: ['client-row__actions'],
    })
    btnWrapper.append(editBtn, deletBtn)
    return [btnWrapper]
  };

  function checkContact(values) {
    let btnInner = '';
    let btnAria = '';
    switch (values[0]) {
      case 'Email':
        btnInner = `<svg width="16" height="16">
        <use xlink:href="icons.svg#contacts-mail"></use>
        </svg>`;
        btnAria = 'Показать Email';
        break;
      case 'Facebook':
        btnInner = `<svg width="16" height="16">
        <use xlink:href="icons.svg#contacts-fb"></use>
        </svg>`;
        btnAria = 'Показать контакт в Facebook';
        break;
      case 'Vk':
        btnInner = `<svg width="16" height="16">
        <use xlink:href="icons.svg#contacts-vk"></use>
        </svg>`;
        btnAria = 'Показать контакт в Vk';
        break;
      case 'Телефон':
        btnInner = `<svg width="16" height="16">
        <use xlink:href="icons.svg#contacts-tel"></use>
        </svg>`;
        btnAria = 'Показать телефон';
        break;
      default:
        btnInner = `<svg width="16" height="16">
          <use xlink:href="icons.svg#contacts-man"></use>
          </svg>`;
        btnAria = 'Дополнительные контакты';
        break;
    }
    return { btnInner, btnAria }
  }

  function formatDate(dateObj) {
    let date = dateObj;
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let h = date.getHours();
    let min = date.getMinutes();

    function addZero(value) {
      value = value < 10 ? '0' + value : value;
      return value;
    }
    day = addZero(day);
    month = addZero(month);
    h = addZero(h);
    min = addZero(min);
    const formatedDate = day + '.' + month + '.' + year;
    const time = h + ":" + min;
    return { formatedDate, time }
  };

  function formatStr(str) {
    let trimmed = str.trim();
    if(trimmed) {
      return trimmed[0].toUpperCase() + trimmed.slice(1);
    }
    return trimmed
  }
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
    return tag;
  }
}
window.Client = Client
