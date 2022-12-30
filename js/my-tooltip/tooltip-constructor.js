function MyTooltip(trigger, userOptions) {
    this.core = {
        main() {
            let defaults = {
                content: null,
                transition: 300,
                easing: 'ease',
                tooltipId: null,
                enableArrow: true,
                triggerEvent: 'click',
                onShow: () => { },
                onHide: () => { },
                makeContent: (trigger) => { },
                tooltipClassName: 'tooltip',
                tooltipVisibleClassName: 'tooltip--visible',
                arrowClassName: 'tooltip-arrow',


            }
            this.options = Object.assign(defaults, userOptions);
            const isString = (typeof trigger === 'string');
            this.triggerBtn = isString ? document.querySelector(trigger) : trigger;
            this.content = this.options.content || this.options.makeContent(this.triggerBtn);
            this.triggerEvent = this.options.triggerEvent;
            this.transition = this.options.transition;
            this.tooltipId = this.options.tooltipId;
            this.tooltip;
            this.arrow;
            this.tooltipPos;//позиция тултипа. относ нее расчитывается положение стрелки
            this.isShown = false;
            this.events()
        },

        events() {
            let isShownByHover = false;
            let isMouseDown = false;//ручное управление фокусом
            this.triggerBtn.addEventListener('mousedown', function () {
                isMouseDown = true;
            })
            this.triggerBtn.addEventListener('mouseup', function () {
                isMouseDown = false
            })

            if (this.triggerEvent.includes('focus')) {
                this.triggerBtn.addEventListener('focus', function (e) {
                    if (isMouseDown || isShownByHover) {
                        this.triggerBtn.blur()
                    } else {
                        this.showTooltip()
                    }
                }.bind(this))
            }

            if (this.triggerEvent.includes('click')) {
                this.triggerBtn.addEventListener('click', function (e) {
                    if (this.isShown && !isShownByHover) {
                        this.hideTooltip()
                    } else if (!this.isShown && !isShownByHover) {
                        this.showTooltip()
                    }
                }.bind(this))
            }

            if (this.triggerEvent.includes('hover')) {
                this.triggerBtn.addEventListener('mouseenter', function (e) {
                    if (this.isShown || e.relatedTarget === this.tooltip) return;
                    isShownByHover = true;
                    this.showTooltip();
                    this.tooltip.addEventListener('mouseleave', function (e) {
                        if (this.isShown && isShownByHover && !e.relatedTarget.closest('.shown')) {
                            this.hideTooltip();
                            isShownByHover = false
                        }
                    }.bind(this))
                }.bind(this))

                this.triggerBtn.addEventListener('mouseleave', function (e) {
                    if (this.isShown && !isShownByHover) return;
                    if (e.relatedTarget === this.tooltip) return;
                    this.hideTooltip()
                    isShownByHover = false;
                }.bind(this))
            }


            document.addEventListener('click', function (e) {
                if (this.isShown && (e.target.closest('.shown') !== this.triggerBtn)) this.hideTooltip()

            }.bind(this))

            document.addEventListener('keydown', function (e) {
                if (this.isShown && ((e.code == 'Tab') || (e.shiftKey && e.code == 'Tab'))) {
                    this.hideTooltip()
                }
            }.bind(this))
        },


        showTooltip() {
            this.isShown = true;
            let tool = this.createTootlitp()
            document.body.append(tool);
            this.triggerBtn.setAttribute('describedby', `tool-${this.tooltipId}`);
            this.triggerBtn.classList.add('shown')
            this.placeTooltip()
            setTimeout(() => {
                this.tooltip.classList.add(this.options.tooltipVisibleClassName);
                this.options.onShow()
            }, this.transition)

        },

        hideTooltip() {
            this.isShown = false;
            this.options.onHide()
            this.tooltip.classList.remove(this.options.tooltipVisibleClassName);
            this.triggerBtn.removeAttribute('describedby');
            this.triggerBtn.classList.remove('shown')
            setTimeout(() => {
                this.tooltip.remove()
            }, this.transition)
        },

        placeTooltip() {
            if (this.tooltip) {
                this.placeText();
                window.addEventListener('resize', function (e) {
                    this.debounce(this.placeText(), 1000)
                }.bind(this))
                this.getScrollingParent(this.triggerBtn).addEventListener('scroll', function (e) {
                    this.placeText()
                }.bind(this))
            };
            if (this.arrow) this.placeArrow();
        },

        placeText() {
            const anchor = this.triggerBtn;

            const anchorCoords = anchor.getBoundingClientRect();
            let tooltipPos = {
                left: anchorCoords.left + window.scrollX - (this.tooltip.offsetWidth - anchor.offsetWidth) / 2,
                top: anchorCoords.top + window.scrollY - this.tooltip.offsetHeight - 10,
                right: anchorCoords.right + window.scrollX + (this.tooltip.offsetWidth - anchor.offsetWidth) / 2,
                bottom: anchorCoords.bottom + window.scrollY + 10,
            }
            if (tooltipPos.right > document.documentElement.clientWidth) {
                tooltipPos.left = document.documentElement.clientWidth - this.tooltip.offsetWidth;
            }
            if (tooltipPos.left < 0) {
                tooltipPos.left = 0
            }
            this.tooltipPos = tooltipPos;
            this.tooltip.style.transform = `translate(${tooltipPos.left}px, ${tooltipPos.top}px)`

        },

        placeArrow() {
            const anchor = this.triggerBtn;
            const anchorCoords = anchor.getBoundingClientRect();
            const anchorCenterByX = anchorCoords.left + window.scrollX + anchor.offsetWidth / 2;
            let arrowShift = this.tooltip.offsetWidth / 2 - this.arrow.offsetWidth / 2;
            if ((this.tooltipPos.left == 0) || (this.tooltipPos.right > document.documentElement.clientWidth)) { arrowShift = anchorCenterByX - this.tooltipPos.left - this.arrow.offsetWidth / 2; }
            this.arrow.style.transform = `translate(${arrowShift}px, 0px)`
        },


        createTootlitp() {
            const { tooltipClassName, arrowClassName, enableArrow, transition, easing } = this.options;
            const tooltipBox = createHtml({
                tagName: 'div',
                classes: [tooltipClassName],
                attributes: this.tooltipId ? { id: `tool-${this.tooltipId}` } : {},
            })
            let isObject = typeof this.content === 'object';
            isObject ? tooltipBox.append(this.content) : tooltipBox.innerHTML = this.content;

            if (enableArrow) {
                const arrow = createHtml({
                    tagName: 'div',
                    classes: [arrowClassName],
                });
                arrow.style.cssText = `position: absolute; z-index: 10; left: 0; bottom: 0;`
                this.arrow = arrow;
                tooltipBox.append(arrow)
            }
            tooltipBox.style.cssText = `position: absolute; z-index: 100; left: 0; top: 0; transition: all ${transition / 1000}s ${easing}`
            this.tooltip = tooltipBox;
            return tooltipBox
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

        debounce(f, ms) {
            let isCooldown = false;
            return function () {
                if (isCooldown) return;
                f.apply(this, arguments);
                isCooldown = true;
                setTimeout(() => isCooldown = false, ms);
            };
        },
        getScrollingParent(el) {
            function getScrollingParent(el) {
                if (!el) return
                if (isScrolling(el)) {
                    return el
                }
                return getScrollingParent(el.parentElement)
            }

            let scrolledElem = getScrollingParent(el)

            function isScrolling(el) {
                const { overflow, overflowX, overflowY } = getComputedStyle(el);
                return /auto|scroll|overlay|hidden/.test(overflow + overflowY + overflowX);

            }
            return scrolledElem
        }
    }
    this.core.main()
    this.replaceTooltip = () => {
        this.core.placeTooltip()
    }
}

window.MyTooltip = MyTooltip
