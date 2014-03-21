// Quick Open
// ==========
//
// Open files quickly with nothing but they keyboard.

// Dependencies
// ------------

import {makeFilter, makeSortFunc} from './filter';

var template = System.import'../templates/index.hbar!';

// Class Definition
export class QuickOpen {
    constructor(app) {
        this.app = app;

        // Load dependencies from inside codio
        this.events = app.get('core/events');
        this.hotkey = app.get('core/settings').hotkey;
        this.Window = app.get('core/window');
        this.$ = app.get('jquery');
        this._ = app.get('lodash');

        // Private Variables
        // -----------------

        // Current open dialog
        this.dialog = null;

        // Currently selected index.
        this.selectedIndex = 0;

        // Current list of all files
        this.files = [];

        // Maximum items to show
        this.maxItems = 50;

        // Items per page
        this.itemsPerPage = 0;
    }

    // Update current template and get it
    //
    // Returns template as jQuery object
    private getContent() {
        this.files = this.app.currentProject.files();
        return this.$(template());
    };

    // Drop selection to first element.
    private dropSelection() {
        this.selectedIndex = 0;
    };

    // Update selection on found items.
    //
    // fileList - jQuery object. List of files.
    private updateSelection(fileList) {
        var elemsAmount = fileList.children().length;
        var scroller = fileList.parent();
        var oldScroll = scroller.scrollTop();
        var liHeight = fileList.children(0).outerHeight();
        var messageHeight = 30;
        var pos = selectedIndex * liHeight;
        // Scroll into view if need be
        var listVisHeight = scroller.prop('clientHeight');
        itemsPerPage = Math.floor(listVisHeight / liHeight);
        var visibleWindowHeight = liHeight * (itemsPerPage - 1);

        if ((oldScroll - pos) > liHeight) {
            scroller.scrollTop(pos);
        } else if ((pos - oldScroll - listVisHeight) > liHeight) {
            scroller.scrollTop(pos - visibleWindowHeight);
        } else if (pos < oldScroll) {
            scroller.scrollTop(oldScroll - liHeight);
        } else if (pos > oldScroll + visibleWindowHeight) {
            scroller.scrollTop(oldScroll + liHeight);
        } else if (this.selectedIndex === maxItems - 1) {
            scroller.scrollTop(oldScroll + messageHeight);
        }

        if (this.selectedIndex < elemsAmount) {
            var visChildren = fileList.children(':visible');
            visChildren.removeClass('selected');
            visChildren.eq(this.selectedIndex).addClass('selected');
        }
    };

    // Setup for dialog.
    private onShow() {
        var self = this;
        return function () {
            self.selectedIndex = 0;
            var content = this.content();
            var input = content.find('.fuzzy-search');
            var fileList = content.find('#fileList');
            var quickOpen = content.find('.quick-open')[0];
            var warningMessage = content.find('#warning-message');

            input.focus();

            // Setup list.js
            var options = {
                valueNames: ['path', 'name'],
                page: self.files.length,
                item: '<li><h2 class="name"></h2><p class="path"></p></li>'
            };

            var list = new List(quickOpen, options, files);

            // hack to create all elements(to set title for all els)
            // and then show only maxItems per page
            list.page = maxItems;

            // set title for all commands
            self._.each(list.items, (item) => {
                var pathEl = $(item.elm).find('.path');
                pathEl.attr('title', item.values().path);
            });

            var lastSearchVal = '';
            list.sort('name', {
                sortFunction: makeSortFunc(''),
                asc: true
            });

            var checkItemsCount = function () {
                if (list.matchingItems.length > list.visibleItems.length) {
                    warningMessage.show();
                } else {
                    warningMessage.hide();
                }
            };

            var changeFunction = () => {
                var searchVal = self.$(this).val();
                if (searchVal !== lastSearchVal) {
                    dropSelection();
                    lastSearchVal = searchVal;
                    list.filter(makeFilter(searchVal));
                    list.sort('name', {
                        sortFunction: makeSortFunc(searchVal),
                        asc: true
                    });

                    self._.delay(checkItemsCount, 150);
                }

                return false;
            };

            // Initial call for update the filter
            changeFunction.call(input);
            updateSelection(fileList);
            checkItemsCount();

            self.events.on(input, 'change', changeFunction);
            self.events.on(fileList, 'click', (e) => {
                onClick(e.target);
            });

            input.blur(() => {
                setTimeout(() => { input.focus(); }, 0);
            });

            self.events.on(input, 'keydown', (e) => {
                // Enter
                if (e.which === 13) {
                    e.preventDefault();
                    onClick(fileList.children(':visible').eq(selectedIndex));
                    return false;
                }

                var max = fileList.children().length;

                // Up and Down Arrows
                if (e.which === 38) {
                    e.preventDefault();
                    if (self.selectedIndex > 0) {
                        --self.selectedIndex;
                    }
                }

                if (e.which === 40) {
                    e.preventDefault();
                    if (self.selectedIndex < max - 1) {
                        ++self.selectedIndex;
                    }
                }

                // PageUp and PageDown
                if (e.which === 33) {
                    e.preventDefault();
                    self.selectedIndex -= itemsPerPage;
                    self.selectedIndex = Math.max(selectedIndex, 0);
                }

                if (e.which === 34) {
                    e.preventDefault();
                    self.selectedIndex += itemsPerPage;
                    self.selectedIndex = Math.min(selectedIndex, max - 1);
                }

                _.defer(() => {
                    changeFunction.call(input);
                    updateSelection(fileList);
                });
            });
        };
    }

    // Click handler
    //
    // el - item element
    private onClick(el) {
        el = this.$(el).closest('li');
        var path = el.find('.path').html();
        path && hotkey.execute('file', 'open', {
            ext: 'tree',
            filename: path
        });
        this.close();
    }

    // Show the search Dialog
    open() {
        if (this.app.ide.isClosed) {
            return;
        }

        this.close();

        dialog = new Window({
            title: 'Quick Open',
            content: getContent(),
            onShow: onShow,
            showTransition: false,
            onClose: () => {
                dialog = null;
            },
            onHide: () => {
                dialog && dialog.close();
            }
        });

        dialog.buttonsPane.remove();
        return dialog;
    };

    close() {
        if (dialog) {
            dialog.close();
        }
    }

}
