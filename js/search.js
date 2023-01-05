function SearchAutocomplete(form, input, userOptions) {
  let _this = this;
  _this.resultsListId;//for aria-controls
  _this.firstItemId;// for aria-activedescendant
  this.core = {
    main() {
      const defaults = {
        requestStr: '',
        onInput: (event, _this) => { },
        onItemClick: (event) => { }
      };
      this.options = Object.assign(defaults, userOptions);
      this.form = form;
      this.input = input;
      this.requestStr = this.options.requestStr;
      this.expanded = false;
      this.resultList;
      this.resultLinksArr = [];
      this.firstResLink;
      this.lastResLink;
      this.currentFocusedIdx;
      this.keydownHandler = (e) => {
        const keys = {
          UP: 'ArrowUp', DOWN: 'ArrowDown', HOME: 'PageUp', END: 'PageDown'
        }
        if (this.expanded && this.isFocused(this.input) && e.code == keys.DOWN) {
          this.setFirstElFocus()
        }else if (this.expanded && !this.isFocused(this.input)) {
          switch (e.code) {
            case keys.UP:
              return this.setPrevElFocus();
            case keys.DOWN:
              return this.setNextElFocus();
            case keys.HOME:
              return this.setFirstElFocus();
            case keys.END:
              return this.setLastElFocus();
            default:
              return null
          }
        }
      };//handler move focus by arrows and pageup/pagedown keys
      this.setAutocomplete()

    },

    setAutocomplete() {
      this.resultList = this.createDropdown();
      this.form.append(this.resultList);
      this.input.addEventListener('input', this.showResults.bind(this))

      document.addEventListener('keyup', function (e) {
        if (this.expanded && e.code == 'Escape') {
          this.hideResults()
          this.input.focus()
        }
      }.bind(this))

      document.addEventListener('click', function (e) {
        if (this.expanded && !e.target.closest('.list-is-shown')) {
          this.hideResults()
          this.input.focus()
        }
      }.bind(this))

    },
    // очищаем список результатов
    hideResults() {
      this.expanded = false;
      this.resultList.innerHTML = '';
      this.input.ariaExpanded = 'false';
      this.form.classList.remove('list-is-shown')
      this.input.value = '';
      this.resultLinksArr = [];
      this.firstResLink = null;
      this.lastResLink = null;
      document.removeEventListener('keydown', this.keydownHandler)
    },
    //создаем список результатов на базе запроса
    async showResults(e) {
      if (!this.input.value) { this.hideResults(); return }
      this.expanded = true;
      let data = await this.getClientsBySearch(input.value);
      this.resultList.innerHTML = '';
      data.forEach((obj, ind) => {
        let itemId = `result-${ind + 1}`;
        if (ind == 0) { _this.firstItemId = itemId; }
        this.resultList.append(this.createResultItem(obj, itemId))
      })
      this.resultLinksArr = [...this.resultList.querySelectorAll('.result-link')];
      this.firstResLink = this.resultLinksArr[0];
      this.lastResLink = this.resultLinksArr[this.resultLinksArr.length - 1];
      this.input.ariaExpanded = 'true';
      this.form.classList.add('list-is-shown');
      this.options.onInput(e, _this);
      document.addEventListener('keydown', this.keydownHandler)

    },

    async getClientsBySearch(searchValue) {
      const response = await fetch(`${this.requestStr}${searchValue}`);
      const data = await response.json();
      return data;
    },

    createDropdown() {
      const listId = 'searchResults';
      _this.resultsListId = listId;
      const resultsList = this.createHtml({
        tagName: 'ul',
        classes: ['results-list'],
        attributes: { id: listId, 'data-simplebar': '', }
      });
      return resultsList
    },

    createResultItem(dataObj, id) {
      const resultItem = this.createHtml({
        tagName: 'li',
        classes: ['results-item'],
        attributes: { id: `${id}`, role: 'option' }
      });
      const resultLink = this.createHtml({
        tagName: 'a',
        classes: ['result-link'],
        attributes: { href: `#${dataObj.id}` },
        inner: `<svg class="loupe-icon" width="16" height="16">
        <use xlink:href="icons.svg#loupe"></use>
        </svg><span class="result-text">${dataObj.surname} ${dataObj.name} ${dataObj.lastName}</span><span class="result-id">${dataObj.id}</span>`
      })
      resultLink.addEventListener('click', function (e) {
        this.options.onItemClick(e)
        this.hideResults()
      }.bind(this))
      resultItem.append(resultLink)
      return resultItem
    },

    createHtml(options) {
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
    },

    /***navigation by arrows and pageup/pagedown****/
    //настройка фокуса предыдущему эл-ту списка
    setPrevElFocus() {
      const prevFoucsedIdx = this.currentFocusedIdx -1;
      if(prevFoucsedIdx < 0) return this.setLastElFocus();
      this.focus(this.resultLinksArr[prevFoucsedIdx]);
      this.currentFocusedIdx = prevFoucsedIdx;
    },
    //настройка фокуса следующему эл-ту списка
    setNextElFocus() {
      const nextFocusedIdx = this.currentFocusedIdx + 1;
      if(nextFocusedIdx > this.resultLinksArr.length-1) return this.setFirstElFocus();
      this.focus(this.resultLinksArr[nextFocusedIdx]);
      this.currentFocusedIdx = nextFocusedIdx;
    },
    //настройка фокуса первому эл-ту списка
    setFirstElFocus() {
      if (!this.resultLinksArr.length) return;
      this.focus(this.firstResLink);
      this.currentFocusedIdx = 0;
    },
    //настройка фокуса последнему эле-ту списка
    setLastElFocus() {
      this.focus(this.lastResLink);
      this.currentFocusedIdx = this.resultLinksArr.length -1;
    },
    //настраивает фокус элементу
    focus(el) {
      el.focus();
      el.classList.add('is-highlighted');
      el.addEventListener('blur', function blurEl(e) {
        el.classList.remove('is-highlighted');
        el.removeEventListener('blur', blurEl)
      })
    },
    // ф-я проверяет в фокусе ли элемент
    isFocused(el) {
      return document.activeElement === el
    },
  }
  this.core.main()
}



const searchForm = document.querySelector('[name="searchForm"]');
const searchInput = searchForm.searchInput
const search = new SearchAutocomplete(searchForm, searchInput, {
  requestStr: 'http://localhost:3000/api/clients?search=',
  onInput: (e, obj) => {
  },
  onItemClick: (e) => {
    let tableWrap = document.querySelector('.table-wrap');
    let resId = e.currentTarget.querySelector('.result-id').textContent
    let elToScroll = tableWrap.querySelector(`[id="${resId}"]`)
    elToScroll.scrollIntoView({ block: "center", behavior: "smooth" });
    elToScroll.classList.add('client-found');
    tableWrap.addEventListener('click', function (e) {
      if (e.target.closest('client-row') == elToScroll) return
      elToScroll.classList.remove('client-found')
    })
  }
})

/*
Инициализация:
new SearchAutocomplete(form, input, userOptions), где form -element,  это форма относительно которой позиционируем элемент, input - element, поле ввода строки для поиска,  userOptions - объект с настройками.


userOptions:
-- requestStr: (string, def: '') строка с частью url запроса, без значения из инпута, оно добавляется плагином
--  onInput: (event, obj) => {} - колбэк который принимает в качестве агрументов объект события при вводе в поле, а также экземпляр конструктора
--onItemClick(e) => {} - колбэк, позволяет добавить действия при клике на результат выбора, в качетсве аргумента принимает объект события.


Доступность:
Конструктор возвращает id первого элемента списка результатов, это значение нужно для настройки атрибута  aria-activedescendant, а также id списка результатов для настрйки атрибута aria-controls. чтобы получить эти данные лучше использовать колбэк onInput
*/
