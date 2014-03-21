import info from 'info';
import hotkeys from 'hotkeys';

import {QuickOpen} from './lib/index';

// Codio expects the plugin to be named `Extension`.
export class Extension {
    // The constructor gets passed the app object which
    // allows for all interaction with the codio code base.
    constructor(app) {
        this.app = app;
        this.info = info;
        this.hotkeys = hotkeys;

        this.quickOpen = new QuickOpen(app);

        // Listen to the hotkey
        events.subscribe('command:ide:key_quick_open', this.quickOpen.open);
        events.subscribe('project:close', this.quickOpen.close);
    }
}
