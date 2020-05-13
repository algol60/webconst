'use strict';

const buildGraphUi = function(data, eventHandler) {
  /**
   * When a user clicks on an element in the grid or sidebar, update everything.
   */
  const selectVxId = function(id) {
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
          { type: 'main', style: pstyle, content: '<canvas id="renderCanvas" touch-action="none"></canvas>' },
          { type: 'bottom', size: 200, resizable: true, style:pstyle, content: 'data' }
      ],
      onResize: function(event) {
        event.done(() => eventHandler('g', 'resize'));
      }
    },
    toolbar: {
      name: 'toolbar',
      items: [
          { type: 'button', id: 'reset', text: 'Reset graph', icon: 'fas fa-sync' }//,
          // { type: 'break' },
          // { type: 'check', id: 'item3', text: 'Check 1'},//, icon: 'fas fa-star' },
          // { type: 'check', id: 'item4', text: 'Check 2', icon: 'fas fa-heart' },
          // { type: 'break' },
          // { type: 'radio', id: 'item5', group: '1', text: 'Radio 1', icon: 'fas fa-star', checked: true },
          // { type: 'radio', id: 'item6', group: '1', text: 'Radio 2', icon: 'fas fa-heart' },
          // { type: 'spacer' },
          // { type: 'button', id: 'item7', text: 'Button', icon: 'fas fa-star' }
      ],
      onClick: function (event) {
          console.log('Target: '+ event.target, event);
          switch(event.target) {
            case 'reset':
              unselect();
              eventHandler('g', 'reset');
              break;
            default:
              console.log(`Unknown target: ${event.target}`);
          }
      }
    },
    sidebar: {
      name: 'sidebar',
      nodes: [],
      onClick: function(event) {
        console.log(event);
        // selectVxId(event.target);
        eventHandler('v', event.target);
      }
    },
    grid: {
      name: 'grid',
      onClick: function(event) {
        console.log(event);
        // selectId(event.recid);
        eventHandler('v', event.recid);
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

  // Which attributes are used for the label and node color attributes?
  //
  const label_attr = data.label_attr;
  const node_color_attr = data.node_color_attr;

  // Build the list of noted nodes.
  //
  if(data.hasOwnProperty('vx_noted')) {
    data.vx_noted.forEach(id => {
      const vx = data.vertex[id];
      const item = {id:id, text: vx[label_attr], img: 'nodes' };
      // console.log(w2ui['sidebar'].get('vxs').nodes);
      w2ui['sidebar'].nodes.push(item);
    });
    w2ui['sidebar'].refresh();
  }

  // Build the grid.
  //
  if(data.hasOwnProperty('ui_attrs')) {
      for(const attr of data.ui_attrs) {
      console.log(`attr: ${attr}`);
      w2ui['grid'].addColumn({field:attr.replace(/\./g, '_'), text:attr});
    }

    const rows = [];
    for(const [id, vx] of Object.entries(data.vertex)) {
      // w2ui.grid uses 'recid' as the default unique row identifier.
      //
      const row = {recid:id};
      for(const attr of data.ui_attrs) {
        row[attr.replace(/\./g, '_')] = vx[attr];
      }
      console.log('NEW ROW', row);
      rows.push(row);
    }
    w2ui['grid'].add(rows);
  }

  return {
    selectVxId: selectVxId,
    unselect: unselect
  };
}