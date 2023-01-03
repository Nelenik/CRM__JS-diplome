function SearchAutocomplete(form, input, userOptions) {
  let _this = this;
  _this.resultsListId;//for aria-controls
  _this.firstItemId;// for aria-activedescendant
  this.core = {
    main() {
      const defaults = {
        onInput: (event, _this) => { },
        onItemClick: (event) => { }
      };
      this.options = Object.assign(defaults, userOptions);
      this.form = form;
      this.input = input;
      this.requestStr = 'http://localhost:3000/api/clients?search=';
      this.expanded = false;
      this.resultList;
      this.resultArr = [];
      this.keydownHandler = (e) => {
        console.log(e.target)
        const keys = {
          UP: 'ArrowUp', DOWN: 'ArrowDown', HOME: 'PageUp', END: 'PageDown'
        }
        if (this.expanded && e.code == keys.DOWN) {
          this.resultArr[0].focus()
          this.resultArr[0].classList.add('is-highlighted')
        }
      };//handler move to first item of list of results
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

    hideResults() {
      this.expanded = false,
        this.resultList.innerHTML = '',
        this.input.ariaExpanded = 'false',
        this.form.classList.remove('list-is-shown')
      this.input.value = '';
      document.removeEventListener('keydown', this.keydownHandler)
    },

    async showResults(e) {
      this.expanded = true;
      let data = await this.getClientsBySearch(input.value);
      this.resultList.innerHTML = '';
      data.forEach((obj, ind) => {
        let itemId = `result-${ind + 1}`;
        if (ind == 0) { _this.firstItemId = itemId; }
        this.resultList.append(this.createResultItem(obj, itemId))
      })

      this.setFocusByArrows()
      this.input.ariaExpanded = 'true';
      this.form.classList.add('list-is-shown')
      this.options.onInput(e, _this)

      if (!this.input.value) { this.hideResults() }
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
    // navigation by arrows and pageup/pagedown
    setFocusByArrows() {
      this.resultArr = this.resultList.querySelectorAll('.result-link');
      document.addEventListener('keydown', this.keydownHandler)
    },
    setPrevElFocus() {},
    setNextElFocus() {},
    isFocused(el) {
      return document.activeElement === el
    },
  }
  this.core.main()
}



const searchForm = document.querySelector('[name="searchForm"]');
const searchInput = searchForm.searchInput
const search = new SearchAutocomplete(searchForm, searchInput, {
  onInput: (e, obj) => {
  },
  onItemClick: (e) => {
    let tableWrap = document.querySelector('.table-wrap');
    console.log(e.currentTarget)
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
--  onInput: (event, obj) => {} - колбэк который принимает в качестве агрументов объект события при вводе в поле, а также экземпляр конструктора
--onItemClick(e) => {} - колбэк, позволяет добавить действия при клике на результат выбора, в качетсве аргумента принимает объект события.


Доступность:
Конструктор возвращает id первого элемента списка результатов, это значение нужно для настройки атрибута  aria-activedescendant.
*/
