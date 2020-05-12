'use strict';

const buildGraphUi = function(data) {
  /**
   * When a user clicks on an element in the grid or sidebar, update everything.
   */
  const selectId = function(id) {
    w2ui['sidebar'].select(id);
    const grid = w2ui['grid'];
    grid.selectNone();
    grid.select(id);
    grid.scrollIntoView(grid.get(id, true));
  }

  const unselect = function() {
    w2ui['sidebar'].unselect();
    w2ui['grid'].selectNone();
  }

  const pstyle = 'border: 1px solid #dfdfdf; padding: 5px;';
  const config = {
    layout: {
      name: 'layout',
      padding: 1,
      panels: [
          { type: 'top', size: 36, resizable: false, style: pstyle, content: 'top' },
          { type: 'left', size: 192, resizable: true, style: pstyle, content: 'left' },
          { type: 'main', style: pstyle, content: 'main <i class="fas fa-camera"></i>' },
          { type: 'bottom', size: 200, resizable: true, style:pstyle, content: 'data' }
      ]
    },
    toolbar: {
      name: 'toolbar',
      items: [
          { type: 'button', id: 'reset', text: 'Reset graph', icon: 'fas fa-sync' },
          { type: 'break' },
          { type: 'check', id: 'item3', text: 'Check 1'},//, icon: 'fas fa-star' },
          { type: 'check', id: 'item4', text: 'Check 2', icon: 'fas fa-heart' },
          { type: 'break' },
          { type: 'radio', id: 'item5', group: '1', text: 'Radio 1', icon: 'fas fa-star', checked: true },
          { type: 'radio', id: 'item6', group: '1', text: 'Radio 2', icon: 'fas fa-heart' },
          { type: 'spacer' },
          { type: 'button', id: 'item7', text: 'Button', icon: 'fas fa-star' }
      ],
      onClick: function (event) {
          console.log('Target: '+ event.target, event);
          switch(event.target) {
            case 'reset':
              unselect();
              break;
            default:
              console.log(`Unknonw target: ${event.target}`);
          }
      }
    },
    sidebar: {
      name: 'sidebar',
      nodes: [],
      onClick: function(event) {
        console.log(event);
        selectId(event.target);
      }
    },
    grid: {
      name: 'grid',
      onClick: function(event) {
        console.log(event);
        selectId(event.recid);
      }
    }
  };

  $(function () {
    // initialization
    $('#main').w2layout(config.layout);
    w2ui.layout.html('top', $().w2toolbar(config.toolbar));
    w2ui.layout.html('left', $().w2sidebar(config.sidebar));
    w2ui.layout.html('bottom', $().w2grid(config.grid));
    // w2ui.layout.content('main', $().w2grid(config.grid1));
    // in memory initialization
    // $().w2grid(config.grid2);
  });

  const params = new URLSearchParams(document.location.search.substring(1));
  let graphName = params.get('graph');
  if(!graphName) {
    graphName = 'graph-5.json'
  }
  console.log(`Graph file: ${graphName}`)

  fetch(graphName)
    .then(response => response.json())
    .then(data => {
      // Which attributes are used for the label and node color attributes?
      //
      const label_attr = data.label_attr;
      const node_color_attr = data.node_color_attr;

      // Build the list.
      //
      data.vx_noted.forEach(id => {
        const vx = data.vertex[id];
        const item = {id:id, text: vx[label_attr], img: 'nodes' };
        // console.log(w2ui['sidebar'].get('vxs').nodes);
        w2ui['sidebar'].nodes.push(item);
      });
      w2ui['sidebar'].refresh();

      // Build the grid.
      //
      for(const attr of data.ui_attrs) {
        console.log(`attr: ${attr}`);
        w2ui['grid'].addColumn({field:attr, text:attr});
      }

      const rows = [];
      for(const [id, vx] of Object.entries(data.vertex)) {
        // w2ui.grid uses 'recid' as the default unique row identifier.
        //
        const row = {recid:id};
        for(const attr of data.ui_attrs) {
          row[attr] = vx[attr];
        }
        rows.push(row);
      }
      w2ui['grid'].add(rows);
    }
  );
}