// Shared searchable timezone picker — used by the player application (home
// page) and the staff application page. Expects the same markup/IDs on
// whichever page calls it: #tzTrigger, #tzDisplay, #tzDropdown, #tzFilter,
// #tzList, #tzHidden (see either page's tz-picker markup for reference).
export function initTimezonePicker() {
    function autoTZ(iana, label) {
        try {
            var off = new Intl.DateTimeFormat('en', { timeZone: iana, timeZoneName: 'shortOffset' })
                .formatToParts(new Date()).find(function(p){ return p.type==='timeZoneName'; })
                .value.replace('GMT','UTC');
            return label + ' (' + off + ')';
        } catch(e) { return label; }
    }

    var TZ_GROUPS = [
        { label: 'UTC / GMT', options: ['UTC (UTC+0)','GMT (UTC+0)'] },
        { label: 'North America', options: [
            'NUT — Niue (UTC−11)','SST — Samoa (UTC−11)',
            'CKT — Cook Islands (UTC−10)','HST — Hawaii (UTC−10)',
            'MART — Marquesas Islands (UTC−9:30)',
            'AKST — Alaska (UTC−9)','GAMT — Gambier Islands (UTC−9)',
            'AKDT — Alaska Daylight (UTC−8)','PST — Pacific (UTC−8)',
            'PDT — Pacific Daylight (UTC−7)','MST — Mountain (UTC−7)',
            'MDT — Mountain Daylight (UTC−6)','CST — Central (UTC−6)',
            'CDT — Central Daylight (UTC−5)','EST — Eastern (UTC−5)',
            'EDT — Eastern Daylight (UTC−4)','AST — Atlantic (UTC−4)',
            'ADT — Atlantic Daylight (UTC−3)',
            'WGT — West Greenland (UTC−3)','GFT — French Guiana (UTC−3)',
            'PMST — Saint Pierre & Miquelon (UTC−3)',
            'NST — Newfoundland (UTC−3:30)','NDT — Newfoundland Daylight (UTC−2:30)',
            'WGST — West Greenland Summer (UTC−2)',
            'EGT — East Greenland (UTC−1)','EGST — East Greenland Summer (UTC+0)'
        ]},
        { label: 'Central America & Caribbean', options: [
            'CST — Mexico/Central America (UTC−6)',
            'EST — Caribbean (UTC−5)','AST — Caribbean (UTC−4)'
        ]},
        { label: 'South America', options: [
            'ECT — Ecuador (UTC−5)','PET — Peru (UTC−5)',
            'COT — Colombia (UTC−5)','BOT — Bolivia (UTC−4)',
            'VET — Venezuela (UTC−4)','GYT — Guyana (UTC−4)',
            'PYT — Paraguay (UTC−4)','CLT — Chile (UTC−3)',
            'ART — Argentina (UTC−3)','UYT — Uruguay (UTC−3)',
            'BRT — Brasília (UTC−3)','SRT — Suriname (UTC−3)'
        ]},
        { label: 'Europe', options: [
            'AZOT — Azores (UTC−1)',
            'CVT — Cape Verde (UTC−1)',
            'WET — Western Europe / UK (UTC+0)',
            'AZOST — Azores Summer (UTC+0)',
            'BST — British Summer Time (UTC+1)','IST — Irish Summer Time (UTC+1)',
            'WEST — Western Europe Summer / Portugal (UTC+1)',
            'CET — Central Europe (UTC+1)','CEST — Central Europe Summer (UTC+2)',
            'EET — Eastern Europe (UTC+2)','EEST — Eastern Europe Summer (UTC+3)',
            'FET — Belarus / Kaliningrad (UTC+3)','MSK — Moscow (UTC+3)'
        ]},
        { label: 'Russia (Far East)', options: [
            'YEKT — Yekaterinburg (UTC+5)',
            'OMST — Omsk (UTC+6)',
            'KRAT — Krasnoyarsk (UTC+7)',
            'IRKT — Irkutsk (UTC+8)',
            'YAKT — Yakutsk (UTC+9)',
            'VLAT — Vladivostok (UTC+10)',
            'MAGT — Magadan (UTC+11)',
            'PETT — Kamchatka (UTC+12)'
        ]},
        { label: 'Africa', options: [
            'WAT — West Africa (UTC+1)','CAT — Central Africa (UTC+2)',
            'SAST — South Africa (UTC+2)','EAT — East Africa (UTC+3)',
            'MUT — Mauritius (UTC+4)','SCT — Seychelles (UTC+4)',
            'RET — Réunion (UTC+4)',
            'TFT — French Southern Territories (UTC+5)',
            'IOT — British Indian Ocean Territory (UTC+6)'
        ]},
        { label: 'Middle East', options: [
            autoTZ('Asia/Jerusalem','Israel'), autoTZ('Asia/Gaza','Palestine'),
            'TRT — Turkey (UTC+3)','AST — Arabia (UTC+3)',
            'IRST — Iran (UTC+3:30)','GST — Gulf (UAE, Oman) (UTC+4)',
            'AMT — Armenia (UTC+4)','AZT — Azerbaijan (UTC+4)',
            'GET — Georgia (UTC+4)','AFT — Afghanistan (UTC+4:30)'
        ]},
        { label: 'Asia', options: [
            'PKT — Pakistan (UTC+5)','UZT — Uzbekistan (UTC+5)',
            'MVT — Maldives (UTC+5)','IST — India (UTC+5:30)',
            'NPT — Nepal (UTC+5:45)','BTT — Bhutan (UTC+6)',
            'BDT — Bangladesh (UTC+6)','ALMT — Kazakhstan (UTC+6)',
            'CCT — Cocos Islands (UTC+6:30)','MMT — Myanmar (UTC+6:30)',
            'ICT — Indochina (Vietnam, Thailand) (UTC+7)','WIB — West Indonesia (UTC+7)',
            'CST — China (UTC+8)','HKT — Hong Kong (UTC+8)',
            'SGT — Singapore (UTC+8)','MYT — Malaysia (UTC+8)',
            'PHT — Philippines (UTC+8)','TWT — Taiwan (UTC+8)',
            'AWST — Western Australia (UTC+8)','WITA — Central Indonesia (UTC+8)',
            'JST — Japan (UTC+9)','KST — Korea (UTC+9)',
            'TLT — East Timor (UTC+9)','PWT — Palau (UTC+9)',
            'WIT — East Indonesia (UTC+9)'
        ]},
        { label: 'Pacific / Oceania', options: [
            'ACST — Central Australia (UTC+9:30)',
            'AEST — Eastern Australia (UTC+10)',
            'CHST — Guam & Northern Mariana Islands (UTC+10)',
            'PGT — Papua New Guinea (UTC+10)',
            'NFT — Norfolk Island (UTC+11)',
            'PONT — Pohnpei / Micronesia (UTC+11)',
            'VUT — Vanuatu (UTC+11)',
            'NCT — New Caledonia (UTC+11)',
            'SBT — Solomon Islands (UTC+11)',
            'AEDT — Eastern Australia Daylight (UTC+11)',
            'FJT — Fiji (UTC+12)','GILT — Kiribati / Gilbert Islands (UTC+12)',
            'MHT — Marshall Islands (UTC+12)','NRT — Nauru (UTC+12)',
            'NZT — New Zealand (UTC+12)','TVT — Tuvalu (UTC+12)',
            'NZDT — New Zealand Daylight (UTC+13)',
            'PHOT — Kiribati / Phoenix Islands (UTC+13)',
            'TOT — Tonga (UTC+13)','WST — Samoa (UTC+13)',
            'LINT — Kiribati / Line Islands (UTC+14)'
        ]}
    ];

    var allOptions = [];
    TZ_GROUPS.forEach(function(g) {
        g.options.forEach(function(o) { if(o) allOptions.push({ text: o, group: g.label }); });
    });

    var trigger  = document.getElementById('tzTrigger');
    var display  = document.getElementById('tzDisplay');
    var dropdown = document.getElementById('tzDropdown');
    var filter   = document.getElementById('tzFilter');
    var list     = document.getElementById('tzList');
    var hidden   = document.getElementById('tzHidden');
    if (!trigger) return;

    var focusedIdx = -1;

    function safeEsc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    function renderList(q) {
        q = (q||'').toLowerCase().trim();
        list.innerHTML = '';
        focusedIdx = -1;
        var filtered = q ? allOptions.filter(function(o){
            return o.text.toLowerCase().indexOf(q) !== -1 || o.group.toLowerCase().indexOf(q) !== -1;
        }) : allOptions;

        if (!filtered.length) {
            list.innerHTML = '<div class="tz-no-results">No results for “' + safeEsc(q) + '”</div>';
            return;
        }

        var lastGroup = null;
        filtered.forEach(function(o) {
            if (!q && o.group !== lastGroup) {
                lastGroup = o.group;
                var gh = document.createElement('div');
                gh.className = 'tz-group-label';
                gh.setAttribute('aria-hidden','true');
                gh.textContent = o.group;
                list.appendChild(gh);
            }
            var el = document.createElement('div');
            el.className = 'tz-option' + (o.text === hidden.value ? ' is-selected' : '');
            el.setAttribute('role','option');
            el.setAttribute('data-value', o.text);
            el.textContent = o.text;

            var touchStartY = 0;
            el.addEventListener('touchstart', function(e){ touchStartY = e.touches[0].clientY; }, { passive: true });
            el.addEventListener('touchend', function(e){
                if (Math.abs(e.changedTouches[0].clientY - touchStartY) < 10) {
                    e.preventDefault();
                    selectOption(o.text);
                }
            }, { passive: false });
            el.addEventListener('mousedown', function(e){ e.preventDefault(); selectOption(o.text); });
            list.appendChild(el);
        });
    }

    function selectOption(value) {
        hidden.value = value;
        display.textContent = value;
        display.classList.add('has-value');
        closeDropdown();
        trigger.focus();
    }

    function openDropdown() {
        dropdown.hidden = false;
        trigger.setAttribute('aria-expanded','true');
        filter.value = '';
        renderList('');
        /* Position above if not enough room below */
        requestAnimationFrame(function() {
            var tRect = trigger.getBoundingClientRect();
            var dRect = dropdown.getBoundingClientRect();
            if (window.innerHeight - tRect.bottom < dRect.height + 10 && tRect.top > dRect.height + 10) {
                dropdown.style.top = 'auto';
                dropdown.style.bottom = 'calc(100% + 5px)';
            } else {
                dropdown.style.top = 'calc(100% + 5px)';
                dropdown.style.bottom = 'auto';
            }
            var sel = list.querySelector('.is-selected');
            if (sel) sel.scrollIntoView({ block: 'nearest' });
            filter.focus();
        });
    }

    function closeDropdown() {
        dropdown.hidden = true;
        trigger.setAttribute('aria-expanded','false');
        focusedIdx = -1;
    }

    function getOpts() { return Array.from(list.querySelectorAll('.tz-option')); }

    function moveFocus(delta) {
        var opts = getOpts();
        if (!opts.length) return;
        focusedIdx = Math.max(0, Math.min(opts.length - 1, (focusedIdx < 0 ? (delta > 0 ? -1 : 0) : focusedIdx) + delta));
        opts.forEach(function(o,i){ o.classList.toggle('is-focused', i === focusedIdx); });
        opts[focusedIdx].scrollIntoView({ block: 'nearest' });
    }

    trigger.addEventListener('click', function(){ dropdown.hidden ? openDropdown() : closeDropdown(); });
    trigger.addEventListener('keydown', function(e){
        if (e.key==='Enter'||e.key===' '){ e.preventDefault(); openDropdown(); }
        else if (e.key==='Escape') closeDropdown();
    });

    filter.addEventListener('input', function(){ renderList(filter.value); });
    filter.addEventListener('keydown', function(e){
        var opts = getOpts();
        if (e.key==='ArrowDown'){ e.preventDefault(); moveFocus(1); }
        else if (e.key==='ArrowUp'){ e.preventDefault(); moveFocus(-1); }
        else if (e.key==='Enter'){
            e.preventDefault();
            if (focusedIdx >= 0 && opts[focusedIdx]) selectOption(opts[focusedIdx].dataset.value);
            else if (opts.length === 1) selectOption(opts[0].dataset.value);
        }
        else if (e.key==='Escape'){ closeDropdown(); trigger.focus(); }
    });

    document.addEventListener('mousedown', function(e){
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
    });
    document.addEventListener('touchstart', function(e){
        if (!trigger.contains(e.target) && !dropdown.contains(e.target)) closeDropdown();
    }, { passive: true });
}
