// PDS menu for this deck. The real code lives in the shared "PDS Tools" library (PDS),
// in development mode, so library updates reach this deck automatically. Don't edit here.

function onOpen(e) {
  try {
    PDS.onOpen(e);
  } catch (err) {
    // Before the first authorisation the library can't load at open time; same menu, built here
    SlidesApp.getUi().createMenu('PDS')
      .addItem('New PDS…', 'pdsMenu11')
      .addSeparator()
      .addItem('Set up deck…', 'pdsMenu1')
      .addItem('Add page(s)…', 'pdsMenu2')
      .addItem('Mark selected pages revised today', 'pdsMenu3')
      .addSubMenu(SlidesApp.getUi().createMenu('Set status of selected pages')
        .addItem('Draft', 'pdsMenu6').addItem('Revisions Needed', 'pdsMenu7').addItem('Complete', 'pdsMenu8')
        .addSeparator().addItem('Superseded', 'pdsMenu9').addItem('Dropped', 'pdsMenu10'))
      .addSeparator()
      .addItem('Archive selected pages…', 'pdsMenu4')
      .addItem('Unarchive selected pages', 'pdsMenu5')
      .addToUi();
  }
}

// Menu slots: the library decides what each slot does, so new menu items need no change here
function pdsMenu1() { PDS.menu(1); }
function pdsMenu2() { PDS.menu(2); }
function pdsMenu3() { PDS.menu(3); }
function pdsMenu4() { PDS.menu(4); }
function pdsMenu5() { PDS.menu(5); }
function pdsMenu6() { PDS.menu(6); }
function pdsMenu7() { PDS.menu(7); }
function pdsMenu8() { PDS.menu(8); }
function pdsMenu9() { PDS.menu(9); }
function pdsMenu10() { PDS.menu(10); }
function pdsMenu11() { PDS.menu(11); }
function pdsMenu12() { PDS.menu(12); }
function pdsMenu13() { PDS.menu(13); }
function pdsMenu14() { PDS.menu(14); }
function pdsMenu15() { PDS.menu(15); }
function pdsMenu16() { PDS.menu(16); }
function pdsMenu17() { PDS.menu(17); }
function pdsMenu18() { PDS.menu(18); }
function pdsMenu19() { PDS.menu(19); }
function pdsMenu20() { PDS.menu(20); }
function pdsMenu21() { PDS.menu(21); }
function pdsMenu22() { PDS.menu(22); }
function pdsMenu23() { PDS.menu(23); }
function pdsMenu24() { PDS.menu(24); }
function pdsMenu25() { PDS.menu(25); }

// Sidebars call back through here
function pdsCall(name, payload) { return PDS.call(name, payload); }
