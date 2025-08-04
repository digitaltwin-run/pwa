dodaj crop canva do przycinania canva do wielkosci oczekiwanej przy exporcie, ale przed eksportem, pozwol na selection z polami input z wartosciami, aby
mozliwe było co do pixela ustalenie wielkosci canva do exportu do svg, pozwol ustawiac granice canva w kolumnie wlasciwosci,
przy eksporcie zaznaczaj automatycznie granice canva z krokiem ustalonym w config grid, tak by byl odstep w postaci 1 grid 
od granic components zawartych w tym obszarze canva svg user moze dodatkowo poszerzyc lub pomniejszyc ten automatycznie przyciety obszar przed eksportem w polu wlasciwosci


w folderze js/components są pliki, które nie powinny istniec, gdyz sa kontekstowe i odnosza sie do istniejacych componentow, te
dane powinny byc pozyskiwane bezposrednio z pliku componentow za pomoca API
jesli jakies skrytpy do obslugi np  pump.svg sa potrzebne to powinny byc tam zawarte w skrypcie w SVG component/*.svg



Przenies wszystko co zwiazane z interakcjami do nowego projektu ../interactions, np usun scriptContent interactions przy eksporrcie SVG 
z projektu pwa/js/export.svg

projekt /home/tom/github/digitaltwin-run/pwa powinien tylko pozwalac tworzyc design canva svg, bez interakcji, dlatego przneis do interakctions 
te funkcje ktore wychodza poza funkcjonalnsoc budowania canva SVG z components

