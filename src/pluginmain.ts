// Sample 'Hello World' Plugin template.
// Demonstrates:
// - typescript
// - using trc npm modules and browserify
// - uses promises. 
// - basic scaffolding for error reporting. 
// This calls TRC APIs and binds to specific HTML elements from the page.  

/// <reference path="../typings/modules/bluebird/index.d.ts" />

import * as trc from 'trclib/trc2';
import * as trcplugin from 'trclib/plugin';
import * as trchtml from 'trclib/trchtml';
import * as gps from 'trclib/gps';
import * as trcFx from 'trclib/trcfx';

import * as Promise from 'bluebird';

declare var $: any; // external definition for JQuery 

// Provide easy error handle for reporting errors from promises.  Usage:
//   p.catch(showError);
declare var showError: (error: any) => void; // error handler defined in index.html

interface IRSSItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    author: string;
}

export class MyPlugin {
    private _sheet: trc.Sheet;
    private _gps: gps.IGpsTracker;
    private _options: trcplugin.PluginOptionsHelper;

    // Entry point called from browser. 
    // This creates real browser objects and passes into the ctor. 
    // Whereas a unit test would skip this and call the ctor directly. 
    public static BrowserEntryAsync(
        sheet: trc.ISheetReference,
        opts: trcplugin.IPluginOptions
    ): Promise<MyPlugin> {
        var trcSheet = new trc.Sheet(sheet);
        var opts2 = trcplugin.PluginOptionsHelper.New(opts, trcSheet);

        // Track GPS location of device
        var gpsTracker = new gps.GpsTracker(); // Only works in browser
        gpsTracker.start(null); // ignore callback

        // Do any IO here...

        var throwError = false;


        var plugin = new MyPlugin(trcSheet, opts2, gpsTracker);
        return plugin.InitAsync().then(() => {
            if (throwError) {
                throw "some error";
            }
            return plugin;
        });
    }

    // Expose constructor directly for tests. They can pass in mock versions. 
    public constructor(
        sheet: trc.Sheet,
        opts2: trcplugin.PluginOptionsHelper,
        gpsTracker: gps.IGpsTracker
    ) {
        this._sheet = sheet; // Save for when we do Post
        this._options = opts2;
        this._gps = gpsTracker;
    }


    // Make initial network calls to setup the plugin. 
    // Need this as a separate call from the ctor since ctors aren't async. 
    private InitAsync(): Promise<void> {

        return this.work();        
    }

    public work() : Promise<void> {
        // Target site must allow RSS 

        return this._sheet.getActivityFeedAsync().then(function (data: any) {
            var $XML = $(data);
            $XML.find("item").each(function () {
                var $this = $(this),
                    item: IRSSItem = {
                        title: $this.find("title").text(),
                        link: $this.find("link").text(),
                        description: $this.find("description").text(),
                        pubDate: $this.find("pubDate").text(),
                        author: $this.find("author").text()
                    };
                // $('#content-div').append($('<h2/>').text(item.title));
                var html = MyPlugin.FormatItem(item);
                $('#content-div').append($(html));

                //etc...
            });
        });
    }

    static FormatItem(item: IRSSItem): string {
        var shortDate = new Date(item.pubDate).toLocaleDateString("en-us");
        var html =
            "<div class='panel panel-default'>" +
            "<div class='panel-heading'><h3>" +
            item.title + "</h3>(" + shortDate + ")" +
            "</div><div class='panel-body'>" +
            item.description +
            "</div></div>";
        return html;
    }
}
