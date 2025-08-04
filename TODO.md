dodaj crop canva do przycinania canva do wielkosci oczekiwanej przy exporcie, ale przed eksportem, pozwol na selection z polami input z wartosciami, aby mozliwe było co do pixela ustalenie wielkosci canva do exportu do svg, pozwol ustawiac granice canva w kolumnie wlasciwosci,
przy eksporcie zaznaczaj automatycznie granice canva z krokiem ustalonym w config grid, tak by byl odstep w postaci 1 grid od granic components zawartych w tym obszarze canva svg
user moze dodatkowo poszerzyc lub pomniejszyc ten automatycznie przyciety obszar przed eksportem w polu wlasciwosci


w folderze js/components są pliki, które nie powinny istniec, gdyz sa kontekstowe i odnosza sie do istniejacych componentow, te dane powinny byc pozyskiwane bezposrednio z pliku componentow za pomoca API
jesli jakies skrytpy do obslugi np  pump.svg sa potrzebne to powinny byc tam zawarte w skrypcie w SVG component/*.svg

Stworz kolejną aplikacje w folderze interactions, ktora ma za zadanie obslugiwac akcje w czasie rzeczywistym, takie jak klikniecie, przeciecie, na bazie 
wczesniej wygenerowane i wyeksportowanego canva SVG, ktory finalnie bedzie czescia pliku html do pliku svg 
Dlatego przygotuj plik html jako canva dla interactions, gdzie bedzie mozliwe
zaimportowanie np dwoch roznych canva z pliku SVG, ktore beda obslugiwane przez akcje w czasie rzeczywistym za pomoca jezyka JS
ktory bedzie czescia tego pliku html,
Celem interactions jest polaczenie plikow SVG z JS w celu stworzenia interaktywnegj strony html z obsluga wszystkich akcji w czasie rzeczywistym
Aby to bylo mozliwe, nalezy stworzyc IDE, z lewą kolumną dla dostepnych zasobów, czyli plikow 
.svg, .js, ktore mozna polaczyc w jednym pliku html
kazdy plik .js powinien zawierac sie w tagach script, ktory bedzie obslugiwal akcje i widoki z svg i pozwalal na modyfikowanie widoku SVG np porzez zmiane wartosci XML w metadata 
metadata powinna byc aktualizowana w czasie rzeczywistym a wewnetrzny skrypt componentu wlaczonego w SVG bedzie obslugiwal zmiany w metadata danego componentu wbudowanego w canva svg w czasie rzeczywistym



