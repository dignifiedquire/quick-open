// Quick Open
// ==========
//
// Open files quickly with nothing but they keyboard.

// Dependencies
// ------------

import $ from 'jquery';
import _ from 'lodash';

import List from 'list';
import events from 'core/events';
import {hotkey} from 'core/settings';
import Window from 'core/window';
import app from 'core/app';
import filterTools from './filter';


// Private Variables
// -----------------

// Current open dialog
var dialog = null;

var template = require('hbars!../templates/index.tpl.html');

// Currently selected index.
var selectedIndex = 0;

// Current list of all files
var files = [];

// Maximum items to show
var maxItems = 50;

// Items per page
var itemsPerPage = 0;

// Private Methods
// ---------------

// Update current template and get it
//
// Returns template as jQuery object
var getContent = function () {
    files = app.currentProject.files();
    return $(template());
};

// Drop selection to first element.
var dropSelection = function () {
    selectedIndex = 0;
};

// Update selection on found items.
//
// fileList - jQuery object. List of files.
var updateSelection = function (fileList) {
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
    } else if (selectedIndex === maxItems - 1) {
        scroller.scrollTop(oldScroll + messageHeight);
    }

    if (selectedIndex < elemsAmount) {
        var visChildren = fileList.children(':visible');
        visChildren.removeClass('selected');
        visChildren.eq(selectedIndex).addClass('selected');
    }
};

// Setup for dialog.
var onShow = function () {
    selectedIndex = 0;
    var content = this.content();
    var input = content.find('.fuzzy-search');
    var fileList = content.find('#fileList');
    var quickOpen = content.find('.quick-open')[0];
    var warningMessage = content.find('#warning-message');

    input.focus();

    // Setup list.js
    var options = {
        valueNames: ['path', 'name'],
        page: files.length,
        item: '<li><h2 class="name"></h2><p class="path"></p></li>'
    };

    var list = new List(quickOpen, options, files);

    // hack to create all elements(to set title for all els)
    // and then show only maxItems per page
    list.page = maxItems;

    // set title for all commands
    _.each(list.items, function (item) {
        var pathEl = $(item.elm).find('.path');
        pathEl.attr('title', item.values().path);
    });

    var lastSearchVal = '';
    list.sort('name', {
        sortFunction: filterTools.makeSortFunc(''),
        asc: true
    });

    var checkItemsCount = function () {
        if (list.matchingItems.length > list.visibleItems.length) {
            warningMessage.show();
        } else {
            warningMessage.hide();
        }
    };

    var changeFunction = function () {
        var searchVal = $(this).val();
        if (searchVal !== lastSearchVal) {
            dropSelection();
            lastSearchVal = searchVal;
            list.filter(filterTools.makeFilter(searchVal));
            list.sort('name', {
                sortFunction: filterTools.makeSortFunc(searchVal),
                asc: true
            });

            _.delay(checkItemsCount, 150);
        }

        return false;
    };

    // Initial call for update the filter
    changeFunction.call(input);
    updateSelection(fileList);
    checkItemsCount();

    events.on(input, 'change', changeFunction);
    events.on(fileList, 'click', function (e) {
        onClick(e.target);
    });

    input.blur(function () {
        setTimeout(function () { input.focus(); }, 0);
    });

    events.on(input, 'keydown', function (e) {
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
            if (selectedIndex > 0) {
                --selectedIndex;
            }
        }

        if (e.which === 40) {
            e.preventDefault();
            if (selectedIndex < max - 1) {
                ++selectedIndex;
            }
        }

        // PageUp and PageDown
        if (e.which === 33) {
            e.preventDefault();
            selectedIndex -= itemsPerPage;
            selectedIndex = Math.max(selectedIndex, 0);
        }

        if (e.which === 34) {
            e.preventDefault();
            selectedIndex += itemsPerPage;
            selectedIndex = Math.min(selectedIndex, max - 1);
        }

        _.defer(function () {
            changeFunction.call(input);
            updateSelection(fileList);
        });
    });

};

// Click handler
//
// el - item element
var onClick = function (el) {
    el = $(el).closest('li');
    var path = el.find('.path').html();
    path && hotkey.execute('file', 'open', {
        ext: 'tree',
        filename: path
    });
    dialog && dialog.close();
};

// Show the search Dialog
export function open() {
    if (app.ide.isClosed) {
        return;
    }

    if (dialog) {
        dialog.close();
        return dialog;
    }

    dialog = new Window({
        title: 'Quick Open',
        content: getContent(),
        onShow: onShow,
        showTransition: false,
        onClose: function () {
            dialog = null;
        },
        onHide: function () {
            dialog && dialog.close();
        }
    });

    dialog.buttonsPane.remove();
    return dialog;
};

export function close() {
    if (dialog) {
        dialog.close();
    }
}
