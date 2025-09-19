class SVGGame {
  constructor(svgUrl, containerId, menuId, lotIds) {
    this.svgUrl = svgUrl;
    this.container = document.getElementById(containerId);
    this.menu = document.getElementById(menuId);
    this.lotIds = lotIds;
    this.panZoom = null;
    this.svgEl = null;
    this.init();
  }

  async init() {
    const svg = await this.loadSVG();
    this.container.innerHTML = svg;
    this.svgEl = this.container.querySelector('svg');
    this.setupSVG();
    this.setupPanZoom();
    this.setupLots();
    this.setupMenuHide();
    if (typeof this.setupOptions === 'function') {
      this.setupOptions();
    } else {
      console.warn('setupOptions is not defined at runtime. Available keys on instance:', Object.keys(this));
    }
    console.log('SVGGame initialized version 1.1');
    window.addEventListener('resize', () => this.handleResize());
  }

  async loadSVG() {
    const res = await fetch(this.svgUrl);
    return res.text();
  }

  setupSVG() {
    this.svgEl.setAttribute('width', '1948.3');
    this.svgEl.setAttribute('height', '1451.6');
    this.svgEl.style.width = '100%';
    this.svgEl.style.height = '100%';
    this.svgEl.style.display = 'block';
    new Vivus(this.svgEl, { type: 'sync', duration: 100 });
    this.fadeInSVGFills(this.svgEl, 1000);
  }

    fadeInSVGFills(svgEl, duration = 1000) {
        const filledEls = svgEl.querySelectorAll('[fill]:not([fill="none"])');
        const stops = svgEl.querySelectorAll('stop');
        filledEls.forEach(el => el.setAttribute('fill-opacity', 0));
        stops.forEach(stop => {
            stop.dataset.origStopOpacity = stop.getAttribute('stop-opacity') ?? 1;
            stop.setAttribute('stop-opacity', 0);
        });
        const start = performance.now();
        function animate(now) {
            const progress = Math.min((now - start) / duration, 1);
            filledEls.forEach(el => el.setAttribute('fill-opacity', progress));
            stops.forEach(stop => {
                const target = parseFloat(stop.dataset.origStopOpacity);
                stop.setAttribute('stop-opacity', target * progress);
            });
            if (progress < 1) requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
    }

  setupPanZoom() {
    function beforePan(oldPan, newPan) {
      var sizes = this.getSizes();
      var scaledViewBoxWidth = sizes.viewBox.width * sizes.realZoom;
      var scaledViewBoxHeight = sizes.viewBox.height * sizes.realZoom;
      var minX = sizes.width - scaledViewBoxWidth;
      var minY = sizes.height - scaledViewBoxHeight;
      var maxX = 0;
      var maxY = 0;
      return {
        x: Math.max(minX, Math.min(maxX, newPan.x)),
        y: Math.max(minY, Math.min(maxY, newPan.y))
      };
    }
    this.panZoom = svgPanZoom(this.svgEl, {
      zoomEnabled: true,
      controlIconsEnabled: true,
      fit: false,
      contain: true,
      minZoom: 1,
      maxZoom: 5,
      center: true,
      panEnabled: true,
      beforePan: beforePan
    });
  }

  setupLots() {
    this.lotIds.forEach(id => {
      const el = this.svgEl.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('click', e => {
          this.populateContextMenu(id);
          this.showMenu(e, el);
        });
      }
    });
  }

  // Theme setup: wire dropdown + randomize and define themes
  setupOptions() {
    // Define available themes following the requested pattern
    this.themes = {
      option1: {
        stroke: '#fff',
        accent: '#00c5c5',
        fill: '#000',
        stop0: '#000',
        stop1: '#00c5c5',
        stop2: '#000',
        stop3: '#408f77ff'  
      },
      option2: {
        stroke: '#ffffffff',
        accent: '#b6e9f0ff',
        fill: '#142f88ff',
        stop0: '#2142afff',
        stop1: '#40adbbff',
        stop2: '#2142afff',
        stop3: '#6bf369ff'
      },
      option3: {
        stroke: '#000000ff',
        accent: '#727272ff',
        fill: '#fff',
        stop0: '#fff',
        stop1: '#727272ff',
        stop2: '#4b4b4bff',
        stop3: '#bbbbbbff'
      },
      option4: {
        stroke: '#ffc400ff',
        accent: '#ffffffff',
        fill: '#0b0b0b',
        stop0: '#0b0b0b',
        stop1: '#ff9f1a',
        stop2: '#776424ff',
        stop3: '#ffbb00ff'
      },
      option5: {
        stroke: '#ffbc00ff',
        accent: '#696180ff',
        fill: '#401a46ff',
        stop0: '#833AB4',
        stop1: '#ff0000',
        stop2: '#ff0000',
        stop3: '#c54fc9ff'
      },
      option6: {
        stroke: '#419e39ff',
        accent: '#00e676',
        fill: '#000000',
        stop0: '#000000',
        stop1: '#00e676', 
        stop2: '#000000',
        stop3: '#00e676'
      },
      option7: {
        stroke: '#ffffffff',
        accent: '#ff0000ff',
        fill: '#000000ff',
        stop0: '#363636ff',
        stop1: '#808080ff',
        stop2: '#000000',
        stop3: '#ff0000ff'
      },
      option8: {
        stroke: '#ff67fb',
        accent: '#ffffffff',
        fill: '#1f1f4e',
        stop0: '#f90000',
        stop1: '#00b8ff',
        stop2: '#004ba1',
        stop3: '#00ff66'
      },
      option9: {
        stroke: '#ff763fff',
        accent: '#ffc21aff',
        fill: '#250000ff',
        stop0: '#472323ff',
        stop1: '#ffffffff',
        stop2: '#472323ff',
        stop3: '#ffd105ff'
      }
    };

    // Apply option1 by default
    this.applyTheme('option1');

    const dropdown = document.getElementById('navbar-dropdown');
    if (dropdown) {
      dropdown.addEventListener('change', (e) => {
        const val = e.target?.value;
        if (val && this.themes[val]) {
          this.applyTheme(val);
        }
      });
    }

    const randomizeBtn = document.getElementById('randomize-theme');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        const theme = this.randomizeTheme();
        this.applyTheme(theme);
      });
    }
  }

  // Apply a theme by name or by direct object
  applyTheme(theme) {
    const t = typeof theme === 'string' ? this.themes?.[theme] : theme;
    if (!t || !this.svgEl) return;
    this.svgEl.style.setProperty('--city-stroke', t.stroke);
    this.svgEl.style.setProperty('--city-accent', t.accent);
    this.svgEl.style.setProperty('--city-fill', t.fill);
    this.svgEl.style.setProperty('--city-gradient-linear-0', t.stop0);
    this.svgEl.style.setProperty('--city-gradient-linear-1', t.stop1);
    this.svgEl.style.setProperty('--city-gradient-radial-0', t.stop2);
    this.svgEl.style.setProperty('--city-gradient-radial-1', t.stop3);
  }

  // Create a random theme ensuring fill==stop0 and accent==stop1
  randomizeTheme() {
    const randColor = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    let stroke = randColor();
    let fill = randColor();
    let accent = randColor();
    let light = randColor();
    let glass = randColor();
    // Avoid identical fill and accent for variety
    let safety = 0;
    // Ensure that there is sufficient difference between stroke and fill
    while (fill.toLowerCase() === stroke.toLowerCase() && safety < 5) {
      stroke = randColor();
      safety++;
    }
    while (fill.toLowerCase() === accent.toLowerCase() && safety < 5) {
      accent = randColor();
      safety++;
    }
    return {
      stroke,
      accent,
      fill,
      stop0: fill,
      stop1: glass,
      stop2: fill,
      stop3: light
    };
  }

  showMenu(e, el) {
    e.preventDefault();
    const pan = this.panZoom.getPan();
    const zoom = this.panZoom.getZoom();
    const svgRect = this.svgEl.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;
    const menuX = mouseX / zoom - pan.x / zoom;
    const menuY = mouseY / zoom - pan.y / zoom;
    let left = (menuX * zoom + pan.x);
    let top = (menuY * zoom + pan.y);
    this.menu.style.display = 'block';
    this.menu.style.left = left + 'px';
    this.menu.style.top = top + 'px';
    const menuRect = this.menu.getBoundingClientRect();
    const winHeight = window.innerHeight;
    const bottomPadding = 16;
    if (menuRect.bottom > winHeight - bottomPadding) {
      const overflow = menuRect.bottom - (winHeight - bottomPadding);
      top = Math.max(8, top - overflow);
      this.menu.style.top = top + 'px';
    }
  }

  setupMenuHide() {
    document.addEventListener('mousedown', e => {
      let isLot = false;
      this.lotIds.forEach(id => {
        const lot = this.svgEl.querySelector(`#${id}`);
        if (lot && lot.contains(e.target)) {
          isLot = true;
        }
      });
      if (this.menu.style.display === 'block' && !this.menu.contains(e.target) && !isLot) {
        this.menu.style.display = 'none';
      }
    });
  }



animateGroup(groupId, duration = 2000, direction = 'out') {
  const groupEl = this.svgEl.querySelector(`#${groupId}`);
  if (!groupEl) return;
  const vivus = new Vivus(groupEl, {
    type: 'sync',
    duration: duration / 10,
    reverseStack: true,
    start: 'manual'
  });
  // If direction is 'in', start hidden and animate in; if 'out', start visible and animate out
  vivus.setFrameProgress(direction === 'in' ? 0 : 1);
  groupEl.style.opacity = direction === 'in' ? 0 : 1;
  let start = null;
  function animate(ts) {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    if (direction === 'in') {
      vivus.setFrameProgress(progress);
      groupEl.style.opacity = progress;
    } else {
      vivus.setFrameProgress(1 - progress);
      groupEl.style.opacity = 1 - progress;
    }
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  requestAnimationFrame(animate);
}

  handleResize() {
    if (this.panZoom) {
      this.panZoom.resize();
      this.panZoom.fit();
      this.panZoom.center();
    }
  }

  populateContextMenu(lotId) {
    const lot = lotData[lotId];
    if (!lot) return;
    const menu = this.menu;
    let html = '';
    html += `<div class="context-menu-heading">${lot.heading}</div>`;
    html += `<div class="context-menu-heading-desc">${lot.desc}</div>`;
    html += `<div class="context-menu-columns">`;
    html += `<div>${lot.columns[0]}</div>`;
    html += `<div>${lot.columns[1]}</div>`;
    html += `</div>`;
    lot.options.forEach(option => {
      html += `<div class="context-menu-option${option.selected ? ' selected' : ''}">`;
      html += `<div class="context-menu-desc">${option.desc}</div>`;
      html += `<div class="context-menu-price">$${option.cost.toLocaleString()}</div>`;
      html += `</div>`;
    });
    menu.innerHTML = html;
      // Attach click handlers to all options
      const optionEls = menu.querySelectorAll('.context-menu-option');
      optionEls.forEach((optionEl, idx) => {
        optionEl.addEventListener('click', () => {
          this.menu.style.display = 'none';
          this.animateGroup(lotId, 2000, 'out');
        });
      });
  }
}

// Lot data for context menus
const lotData = {
  'lot-marketing': {
    heading: 'Marketing',
    desc: 'How people can find your company. Necessary to upgrade to grow to bigger levels.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      {
        desc: 'Local Flyering',
        cost: 100,
        pricedesc: '$100 per month',
        details: [],
        action: 'marketing0'
      },
      {
        desc: 'Local Paper Ads',
        cost: 500,
        pricedesc: '$500 per month',
        details: [
          'Increase to Audience Attendance and Viewership',
          'Necessary to progress past 20 Popularity in promotion'
        ],
        action: 'marketing1'
      },
      {
        desc: 'Local TV Ads',
        cost: 5000,
        pricedesc: '$5,000 per month',
        details: [
          'Bigger increase to Audience Attendance and Viewership',
          'Necessary to progress past 40 Popularity in promotion'
        ],
        action: 'marketing2'
      },
      {
        desc: 'Nationwide Marketing Campaign',
        cost: 20000,
        pricedesc: '$20,000 per month',
        details: [
          'Large increase to Audience Attendance and Viewership',
          'Necessary to progress past 60 Popularity in promotion'
        ],
        action: 'marketing3'
      },
      {
        desc: 'Huge Marketing Campaign',
        cost: 1000000,
        pricedesc: '$1,000,000 per month',
        details: [
          'Huge increase to Audience Attendance and Viewership',
          'Necessary to progress past 80 Popularity in promotion'
        ],
        action: 'marketing4'
      },
      {
        desc: 'Global Marketing Campaign',
        cost: 3000000,
        pricedesc: '$3,000,000 per month',
        details: [
          'Massive increase to Audience Attendance and Viewership',
          'Receive double growth rate in continents outside your own.'
        ],
        action: 'marketing5'
      }
    ]
  },
  'lot-back-office': {
    heading: 'Back Office',
    desc: 'As a company grows, so does the infrastructure required to run it - accountants, legal, HR etc. Not improving your back office will result in your company being unable to grow. Each level will improve merchandise sales significantly, if you are eligible to sell any.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      {
        desc: 'No Other Employees',
        cost: 0,
        pricedesc: '$0 per month',
        details: [],
        action: 'backOffice0'
      },
      {
        desc: 'Small Part Time Team',
        cost: 500,
        pricedesc: '$500 per month',
        details: ['Necessary to progress past 20 Popularity in promotion'],
        action: 'backOffice1'
      },
      {
        desc: 'Small Full Time Team',
        cost: 10000,
        pricedesc: '$10,000 per month',
        details: ['Necessary to progress past 40 Popularity in promotion'],
        action: 'backOffice2'
      },
      {
        desc: 'Small Office',
        cost: 500000,
        pricedesc: '$500,000 per month',
        details: ['Necessary to progress past 60 Popularity in promotion'],
        action: 'backOffice3'
      },
      {
        desc: 'Large Office',
        cost: 1000000,
        pricedesc: '$1,000,000 per month',
        details: ['Necessary to progress past 80 Popularity in promotion'],
        action: 'backOffice4'
      },
      {
        desc: 'Global Headquarters',
        cost: 5000000,
        pricedesc: '$5,000,000 per month',
        details: ['Receive double growth rate in continents outside your own.'],
        action: 'backOffice5'
      }
    ]
  },
  'lot-music': {
    heading: 'Music',
    desc: 'Music used for events and entrance music.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      {
        desc: 'Copyright Free',
        cost: 0,
        pricedesc: '$0 per month',
        details: ['$0 implementation cost'],
        action: 'music0'
      },
      {
        desc: 'In-House',
        cost: 30000,
        pricedesc: '$30,000 per month',
        details: [
          '$10,000 implementation cost',
          '+25% Worker Popularity Gain'
        ],
        action: 'music1'
      },
      {
        desc: 'Indy Licensed',
        cost: 100000,
        pricedesc: '$100,000 per month',
        details: [
          '$100,000 implementation cost',
          '+50% Worker Popularity Gain'
        ],
        action: 'music2'
      },
      {
        desc: 'Major Licensed',
        cost: 1500000,
        pricedesc: '$1,500,000 per month',
        details: [
          '$1,000,000 implementation cost',
          '+100% Worker Popularity Gain'
        ],
        action: 'music3'
      }
    ]
  },
  'lot-development': {
    heading: 'Development',
    desc: 'Development lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No devs', cost: 0, pricedesc: 'No cost' },
      { desc: 'Freelancer', cost: 1000, pricedesc: 'Single developer' },
      { desc: 'Full team', cost: 20000, pricedesc: 'Multiple developers' },
      { desc: 'Studio', cost: 100000, pricedesc: 'Professional studio' }
    ]
  },
  'lot-marketing': {
    heading: 'Marketing',
    desc: 'Marketing lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No marketing', cost: 0, pricedesc: 'No cost' },
      { desc: 'Social media', cost: 500, pricedesc: 'Online presence' },
      { desc: 'TV ads', cost: 10000, pricedesc: 'Mass media' }
    ]
  },
  'lot-writing': {
    heading: 'Writing',
    desc: 'Writing lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No writers', cost: 0, pricedesc: 'No cost' },
      { desc: 'Script writer', cost: 1000, pricedesc: 'Professional script' }
    ]
  },
  'lot-venue': {
    heading: 'Venue',
    desc: 'Venue lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No venue', cost: 0, pricedesc: 'No cost' },
      { desc: 'Small hall', cost: 2000, pricedesc: 'Small event' },
      { desc: 'Stadium', cost: 50000, pricedesc: 'Large event' }
    ]
  },
  'lot-camera': {
    heading: 'Camera',
    desc: 'Camera lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No camera', cost: 0, pricedesc: 'No cost' },
      { desc: 'Single camera', cost: 500, pricedesc: 'Basic coverage' },
      { desc: 'Multi-cam', cost: 5000, pricedesc: 'Professional coverage' }
    ]
  },
  'lot-editing': {
    heading: 'Editing',
    desc: 'Editing lot description goes here.',
    columns: ['DESCRIPTION', 'MONTHLY COST'],
    options: [
      { desc: 'No editing', cost: 0, pricedesc: 'No cost' },
      { desc: 'Basic editing', cost: 1000, pricedesc: 'Simple edits' },
      { desc: 'Pro editing', cost: 10000, pricedesc: 'Advanced edits' }
    ]
  }
};
