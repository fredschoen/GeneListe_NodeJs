// Généré automatiquement depuis Data\Qui.csv le 2026-02-14T21:27:22.011Z
(function(){
  const headers = [
  "ID",
  "Nom",
  "Prenom",
  "Naiss_AAAA",
  "Naiss_MM",
  "Naiss_JJ",
  "Deces_AAAA",
  "Deces_MM",
  "Deces_JJ",
  "Gene",
  "Info"
];
  const rows = [
  {
    "ID": "4",
    "Nom": "aa",
    "Prenom": "pp",
    "Naiss_AAAA": "",
    "Naiss_MM": "",
    "Naiss_JJ": "",
    "Deces_AAAA": "",
    "Deces_MM": "",
    "Deces_JJ": "",
    "Gene": "#aa#ba#ca#da#ea#fd#",
    "Info": ""
  },
  {
    "ID": "3",
    "Nom": "aa",
    "Prenom": "ff",
    "Naiss_AAAA": "1960",
    "Naiss_MM": "",
    "Naiss_JJ": "",
    "Deces_AAAA": "",
    "Deces_MM": "",
    "Deces_JJ": "",
    "Gene": "#aa#ba#ca#da#ea#fc#",
    "Info": ""
  },
  {
    "ID": "2",
    "Nom": "aa",
    "Prenom": "vv",
    "Naiss_AAAA": "1958",
    "Naiss_MM": "22",
    "Naiss_JJ": "22",
    "Deces_AAAA": "22",
    "Deces_MM": "22",
    "Deces_JJ": "22",
    "Gene": "#aa#ba#ca#da#ea#fb#",
    "Info": "22"
  },
  {
    "ID": "1",
    "Nom": "aa",
    "Prenom": "tt",
    "Naiss_AAAA": "1956",
    "Naiss_MM": "11",
    "Naiss_JJ": "11",
    "Deces_AAAA": "11",
    "Deces_MM": "11",
    "Deces_JJ": "11",
    "Gene": "#aa#ba#ca#da#ea#fa#",
    "Info": "11"
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