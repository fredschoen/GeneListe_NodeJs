(function(){
  const headers = [
  "ID",
  "Gene",
  "Nom",
  "Prenom",
  "S",
  "Naiss_AAAA",
  "Naiss_MM",
  "Naiss_JJ",
  "Deces_AAAA",
  "Deces_MM",
  "Deces_JJ",
  "Info"
];
  const rows = [
  {
    "ID": "3",
    "Gene": "&1a&2a&",
    "Nom": "FRAISSINET",
    "Prenom": "Marc",
    "S": "M",
    "Naiss_AAAA": "1864",
    "Naiss_MM": "",
    "Naiss_JJ": "",
    "Deces_AAAA": "",
    "Deces_MM": "",
    "Deces_JJ": "",
    "Info": "carole; &cf"
  },
  {
    "ID": "4",
    "Gene": "&1a&2a&0",
    "Nom": "COUVE",
    "Prenom": "Eugénie",
    "S": "F",
    "Naiss_AAAA": "1871",
    "Naiss_MM": "",
    "Naiss_JJ": "",
    "Deces_AAAA": "",
    "Deces_MM": "",
    "Deces_JJ": "",
    "Info": "carole; &cf"
  }
];
  window.renderJs = function(renderFn){
    if (typeof renderFn === 'function') {
      renderFn(headers, rows);
    } else if (typeof window.render === 'function') {
      window.render(headers, rows);
    } else {
      console.warn('Aucune fonction render disponible pour afficher les données JS.');
    }
  };
})();

