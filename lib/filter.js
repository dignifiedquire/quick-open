// Tools for search on list
// =======================
// Create filter finction for list extension.
//
// search - String. filtered by.
//
// Returns function
export function makeFilter(search) {
    return function (elem) {
        search = search.toUpperCase();
        var text = elem.values().path.toUpperCase();

        var j = 0; // remembers position of last found character

        // consider each search character one at a time
        for (var i = 0; i < search.length; i++) {
            var l = search[i];
            if (l === ' ') {
                // ignore spaces
                continue;
            }

            j = text.indexOf(l, j);     // search for character & update position
            if (j === -1) {
                return false;
            }  // if it's not found, exclude this item
        }

        return true;
    };
}

// Create sorting function relevant to `search`.
//
// search - String. sorted by.
//
// Return functon.
export function makeSortFunc(search) {
    if (search.length > 0) {
        return function (a, b) {
            var s = search.toUpperCase();
            var aName = a.values().name.toUpperCase();
            var bName = b.values().name.toUpperCase();
            var aPath = a.values().path.toUpperCase();
            var bPath = b.values().path.toUpperCase();

            var i, ch, aRel, bRel;
            for (i = 0; i < s.length; i++) {
                ch = s[i];
                aRel = aName.indexOf(ch, i);
                bRel = bName.indexOf(ch, i);
                if (aRel === bRel) {
                    continue;
                } else {
                    if (aRel < 0) {
                        return 1;
                    } else if (bRel < 0) {
                        return -1;
                    } else {
                        return (aRel - i) - (bRel - i);
                    }
                }
            }

            for (i = 0; i < s.length; i++) {
                ch = s[i];
                aRel = aPath.indexOf(ch, i);
                bRel = bPath.indexOf(ch, i);
                if (aRel === bRel) {
                    continue;
                } else {
                    return (aRel - i) - (bRel - i);
                }
            }

            return aName.length > bName.length;
        };
    } else {
        return undefined;
    }
}
