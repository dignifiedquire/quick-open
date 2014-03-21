// ES6 style imports
import {QuickOpen} from './lib/index';


// Codio expects the plugin to be named `Extension`.
export class Extension {
    // The constructor gets passed the app object which
    // allows for all interaction with the codio code base.
    constructor(app) {
        this.app = app;
        // System.import is async so all
        // these are promises, so they can be used like this:
        // this.info.then((info) => { ... });
        this.info = System.import('./package.json!');
        this.hotkeys = System.import('./hotkeys.json!';
        this.style = System.import('./style.less!');

        // Pass the codio app object to the QuickOpen class
        this.quickOpen = new QuickOpen(app);

        // Listen to the hotkey
        events.subscribe('command:ide:key_quick_open', this.quickOpen.open);
        events.subscribe('project:close', this.quickOpen.close);
    }
}
