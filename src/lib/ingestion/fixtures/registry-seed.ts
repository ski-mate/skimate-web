/**
 * Fixture seed for the Ingestion Console mock adapter.
 *
 * The first block is a **real snapshot** of `public.resorts` in the production
 * Supabase project (kjnuzuagvjkwbsyxmqep), taken 2026-09-10, joined against the
 * live trail / lift / commercial-POI counts. Columns:
 *
 *   name | locationName | osmId | lat | lng | baseAlt | summitAlt | trails | lifts | places
 *
 * It is used verbatim because inventing resort data would have hidden exactly
 * the pathologies the console exists to fix. Every one of them is in here:
 *
 *   - "Les 3 Vallées" (osm 45117869) and "Les Trois Vallées" (osm 3545276) are
 *     the same domain twice, ~90% mutually overlapping, 368 trails each.
 *   - "Val Thorens" (osm 1422277144) contains "Val Thorens - Orelle"
 *     (osm 19757448); both are registry rows today.
 *   - Courchevel, Méribel and Les Menuires are **absent entirely** — they have
 *     no ski-area polygon, so the geometry-derived pipeline never minted them.
 *     They are deliberately not added below: minting them is the analyst's job
 *     in the onboarding wizard, and their unclaimed commerce is what fills the
 *     orphan belt on screen 4.
 *   - `baseAltitude = -32768` appears on several rows (Col d'Ornon, Les Deux
 *     Alpes, La Grave…) — an unguarded no-data sentinel that reaches the app.
 *     The QA workspace surfaces it as a category outlier.
 *   - Near-duplicate names abound (Le Grand Bornand / Le Grand-Bornand,
 *     Thollon les Mémises / Thollon-les-Mémises, Megève / Megève-Saint-Gervais).
 *
 * The second block is the onboarding roadmap: well-known resorts that are not
 * in the database yet, carrying approximate coordinates. They exist so the
 * worklist is the ~200-entry atlas the console is scoped for, and they all sit
 * at `not_started`.
 */

export interface SeedResort {
  name: string;
  locationName: string | null;
  osmId: number | null;
  lat: number;
  lng: number;
  baseAltitude: number | null;
  summitAltitude: number | null;
  trails: number;
  lifts: number;
  places: number;
  /** True for the live snapshot, false for roadmap entries. */
  imported: boolean;
}

const SNAPSHOT = `
Abondance||5763633|46.2651|6.7038|923|1676|10|9|11
Aiguille du Midi (Chamonix)||642259707|45.8943|6.9123|1032|3707|17|9|154
Aillon-le-Jeune||601114119|45.5988|6.1094|941|1530|15|8|27
Aillon-Margériaz||3922976|45.6397|6.0521|1382|1814|23|10|3
Albiez-Montrond||3923817|45.2103|6.3496|1360|1997|15|7|23
Alpe d'Huez Grand Domaine||45438982|45.1051|6.0924|724|3291|140|70|193
Arêches Beaufort||51071766|45.6643|6.5537|1019|2312|43|13|69
Association Téléski du Salève (A.T.S.)||6728726|46.1178|6.1675|1172|1272|1|1|2
Aussois||45524871|45.2516|6.7373|1527|2674|24|9|69
Autrans - Grand domaine la Sure||331209851|45.2274|5.5862|1219|1619|12|6|22
Autrans||2801730|45.2086|5.5649|1041|1479|17|8|142
Avoriaz||20949263|46.1885|6.7731|961|2233|82|35|238
Balme - Vallorcine||642249053|46.0250|6.9528|1259|2250|25|9|30
Bernex||5759124|46.3489|6.7016|987|1846|17|10|37
Bessans||1254202941|45.3214|6.9972|1678|1856|0|2|34
Bonneval-sur-Arc||4664783|45.3610|7.0566|1799|2934|27|10|37
Brévent/Flégère (Chamonix)||642247840|45.9500|6.8696|1052|2485|42|16|162
Cascades de Glace du Reposoir||1274802207|45.9909|6.5185|||0|0|0
Chalmazel||555941955|45.6675|3.8134|1113|1591|12|8|11
Champéry – Les Crosets – Champoussin – Morgins||20949264|46.2007|6.8402|1308|2114|15|4|4
Chamrousse||8763133|45.1120|5.8845|1411|2238|54|18|91
Col d'Ornon||676485850|45.0095|5.9740|-32768|1509|9|4|19
Col de l'Arzelier||549105845|44.9914|5.5855|-32768|-32768|0|1|13
Col de Marcieu||294937387|45.3492|5.9019|1028|1465|4|3|13
Col de Plainpalais||3922977|45.6420|6.0250|1170|1437|3|1|3
Col de Porte||6090461|45.2968|5.7649|1244|1554|0|5|29
Colline des Bains||1083826895|45.0656|5.5515|996|1325|0|3|41
Cordon||599425975|45.9139|6.5883|1010|1553|13|7|6
Courmayeur||447819146|45.8041|6.9375|2161|3684|0|1|1
Domaine Alpin du Col d'Ornon||11958914|45.0171|5.9742|-32768|1504|7|2|2
Domaine Autrans - Méaudre||17273806|45.1949|5.5609|974|1340|27|19|164
Domaine de Beldina||294826109|45.2391|5.9923|1296|1444|2|0|18
Domaine du Barioz||294837800|45.3239|6.0565|1433|1716|2|0|12
Domaine Nordique - Vallon de Champagny le Haut||1355974363|45.4564|6.7490|||0|0|19
Domaine nordique des Moises||12203182|46.2709|6.4759|1067|1503|0|0|25
Domaine Nordique Peisey-Vallandry||1354438774|45.5224|6.7954|||0|0|23
Domaine Skiable Chamrousse||1254312210|45.1120|5.8845|1411|2238|54|18|91
Espace Diamant (Les Saisies)||599426852|45.7818|6.5487|1198|1241|155|81|243
Espace Diamant||5993384|45.7800|6.5438|959|2034|156|81|233
Espace Haute Maurienne Vanoise||17261990|45.2513|6.8349|1223|1681|172|77|643
Espace Liberté||20949265|46.2700|6.8265|1033|2084|63|46|118
Evasion Mont Blanc||17261841|45.8451|6.6480|1044|1318|229|105|484
Flaine||13766276|46.0032|6.7042|1505|2466|61|23|111
Font d'Urle Chaud Clapier||601135063|44.9096|5.3230|1295|1544|14|12|16
Galibier-Thabor||5731035|45.1636|6.4693|1563|1617|90|32|404
Grange des Bois||1227316991|46.2873|6.5085|1083|1161|1|1|4
Gresse en Vercors||549102651|44.8903|5.5414|1252|1706|19|10|12
Hirmentaz - Les Habères||5757153|46.2377|6.4912|939|1597|24|19|22
L'Alpe du Grand Serre||549108702|45.0060|5.8465|-32768|2124|34|14|20
L’Essert – Abondance||601130399|46.2687|6.7033|||11|9|12
La Chapelle d'Abondance||5763676|46.2922|6.7951|995|1626|20|11|35
La Clusaz||5994241|45.8880|6.4374|1033|2460|78|50|165
La Croisette||1227322990|46.1176|6.1673|||1|1|2
La Croix de Bauzon||555925509|44.6233|4.0820|1278|1505|6|7|6
La Féclaz||549210956|45.6424|5.9818|1302|1522|16|6|56
La Grave||45146740|45.0216|6.2819|-32768|3535|1|1|0
La Norma||4675075|45.1918|6.7119|1344|2711|31|15|51
La Plagne||5994157|45.5066|6.6967|1162|3023|156|84|293
La Poya (Chamonix)||294934330|46.0171|6.9156|1341|1499|0|4|22
La Rosière||5752780|45.6414|6.8643|884|2761|48|25|85
La Sambuy Seythenex||51071464|45.7079|6.2773|1153|1173|1|1|25
La Thuile ski||5752851|45.6844|6.9029|1911|2590|10|2|5
La Thuile||542214331|45.6936|6.9240|||9|2|5
La Vattay||3161151|46.4019|6.0790|||0|0|3
Lachat||9227579|46.0709|5.6629|||0|0|2
Lans en Vercors||2798246|45.1028|5.5908|1389|1391|0|0|60
Le Collet d'Allevard||294939838|45.3943|6.1309|1419|2062|29|10|21
Le Grand Bornand||601132346|45.9627|6.4760|||50|26|81
Le Grand Domaine||5993118|45.4383|6.4062|1395|2257|107|53|278
Le Grand Massif||5994258|46.0293|6.6944|||149|66|416
Le Grand-Bornand||5994252|45.9643|6.4723|942|2010|50|26|60
Le Granier||549179618|45.4603|5.9064|996|1413|4|4|2
Le Reposoir Chalet Neuf||1485685609|46.0058|6.5045|1330|1652|0|1|2
Le Reposoir||1227322457|46.0085|6.5340|979|1091|0|4|10
Le Revard||1254296225|45.6728|6.0045|1283|1537|11|4|111
Le Semnoz||601113698|45.7962|6.1021|1421|1680|22|9|16
Le Tourchet (Chamonix)||642233789|45.8914|6.8020|999|1071|1|2|20
Les 3 Vallées||45117869|45.3439|6.5770|||368|145|576
Les 7 Laux||294826110|45.2571|6.0278|1335|2351|43|22|53
Les Arcs / Peisey-Vallandry||589005175|45.5703|6.8124|1132|1817|128|63|254
Les Arcs||5994162|45.5685|6.8058|808|3206|128|64|254
Les Chosalets (Chamonix)||642252996|45.9741|6.9238|1224|1252|3|2|11
Les Contamines||5993391|45.7905|6.6834|1154|2421|47|22|76
Les Coulmes||1254287014|45.1389|5.4848|1065|1216|0|3|5
Les Deux Alpes||45146739|45.0050|6.1632|-32768|3505|97|44|175
Les Egaux - St Hugues||999474373|45.3135|5.8006|950|1083|5|4|11
Les Entremonts||549179138|45.4693|5.8651|1110|1446|2|3|14
Les Estables||447908211|44.9163|4.1656|1464|1505|0|0|12
Les Gets-Morzine||1422098961|46.1538|6.6887|980|1963|81|45|264
Les Grands Montets||642251577|45.9627|6.9453|1235|3220|29|11|37
Les Houches - Saint-Gervais||5993393|45.8818|6.7548|998|1923|37|14|55
Les Houches (Chamonix)||447819151|45.8842|6.7601|983|1107|40|15|72
Les Karellis||4661006|45.2135|6.3975|1550|2473|27|13|90
Les Planards (Chamonix)||642256846|45.9256|6.8838|1057|1612|5|4|21
Les Portes du Mont-Blanc||5993417|45.8803|6.5858|1018|1902|98|29|76
Les Portes du Soleil||19457834|46.2085|6.7636|925|1783|252|150|776
Les Signaraux||674846063|44.9344|5.7402|1285|1418|4|1|16
Les Sybelles||6960124|45.2397|6.2412|1273|2572|133|57|174
Les Trois Vallées||3545276|45.3427|6.5833|627|2891|368|145|560
Lus la Jarjatte||1254210490|44.6715|5.7712|1176|1511|0|4|2
Massif des Brasses||5757130|46.1762|6.4548|890|1471|28|12|38
Méaudre||2801725|45.1242|5.5095|977|1555|13|9|54
Megève/Saint-Gervais||599426637|45.8487|6.6609|580|1236|104|57|288
Megève||5993424|45.8454|6.6579|796|2343|104|57|270
Menthières||9669912|46.1688|5.8570|1070|1400|1|4|9
Mijoux - La Faucille||8075214|46.3625|6.0093|999|1525|18|6|21
Mont Saxonnex||1227322623|46.0344|6.4973|1037|1536|7|6|19
Montagnes de Lans||331655170|45.1111|5.6159|1370|1802|27|12|14
Montmin - Col de la Forclaz||923537390|45.8059|6.2486|1099|1179|0|2|12
Orelle||19751525|45.2517|6.5769|884|3194|12|6|70
Paradiski||1227560922|45.5347|6.7601|1176|1203|277|145|553
Passy - Plaine Joux||294930896|45.9532|6.7519|1275|1718|12|7|15
Plans d'Hotonnes - Plateau de Retord||758328458|46.0343|5.6968|1008|1120|7|6|13
Plateau de Beauregard||20385000|45.8899|6.3970|1434|1623|2|1|23
Plateau de Retord||9227575|46.0343|5.7012|1093|1223|10|9|15
Plateau des Glières||1144960794|45.9612|6.3379|||0|0|79
Plateau du Revard||10059812|45.6728|6.0045|1280|1537|11|4|111
Pralognan-la-Vanoise||45523958|45.3843|6.7342|1408|2346|22|12|57
Praz de Lys Sommand||5757942|46.1507|6.5703|1262|1931|54|23|40
Roc d'Enfer||5757156|46.2106|6.6079|945|1776|24|16|58
Romme||1227322319|46.0284|6.5781|1192|1560|0|3|4
Saint François Longchamp||20105353|45.4284|6.3807|1602|2514|14|3|35
Saint-Hilaire-du-Touvet||549191825|45.3141|5.8799|977|1327|10|5|11
Saint-Nizier du Moucherotte||599031565|45.1690|5.6319|||0|1|15
Saint-Nizier-du-Moucherotte||3299314|45.1688|5.6320|1165|1206|0|1|15
Saint-Pierre-de-Chartreuse||549189984|45.3527|5.8371|1096|1749|5|11|47
Sainte-Foy Tarentaise||5502698|45.5818|6.9140|1506|2594|26|6|30
Sappey-en-Chartreuse||999468694|45.2520|5.7815|978|1324|0|4|13
Snowpark de Chatel Secteur SUPER CHATEL||1552314372|46.2640|6.8564|1535|1682|0|0|2
Stade de neige du Col du Feu||12211261|46.2893|6.5080|1083|1176|1|1|5
Stade des Neiges du Barioz||294837783|45.3294|6.0546|1374|1704|4|3|6
Station du Col de Rousset||549042071|44.8352|5.4202|1268|1681|23|9|16
Terre Ronde - La Praille||9227591|45.9835|5.6317|1008|1192|2|0|5
Terre Ronde||758317682|45.9859|5.6247|931|1186|10|4|5
Thollon les Mémises||601130398|46.3797|6.7372|1013|1861|21|15|26
Thollon-les-Mémises||5759134|46.3783|6.7271|926|1583|21|15|31
Tignes - Val d'Isère||45421423|45.4436|6.9449|1560|3449|184|82|280
Torgon||19457712|46.2991|6.8406|1335|1981|20|9|14
Vail Mountain|Vail, Colorado||39.6061|-106.3742|2476|3527|8|5|7
Val Cenis||332881926|45.2731|6.8869|1295|2735|62|32|143
Val Thorens - Orelle||19757448|45.2827|6.5788|1742|3151|105|29|109
Val Thorens||1422277144|45.2705|6.5716|1763|3038|107|30|188
Valfréjus||4664752|45.1550|6.6588|1545|2702|29|10|54
Valloire - Galibier Thabor||601130263|45.1632|6.4705|1406|2727|89|32|408
Valmorel||20046699|45.4508|6.4260|1215|2383|70|36|194
Villages||13766275|46.0418|6.6956|683|2099|96|45|366
Villard de Lans - Corrençon||1137880487|45.0244|5.5530|-32768|2057|38|25|99
Vormaine||642270217|46.0036|6.9526|1480|1617|4|4|2
Whistler Blackcomb|Whistler, British Columbia||50.0576|-122.9489|675|2284|7|5|8
`;

/**
 * The onboarding roadmap — real resorts with approximate coordinates, none of
 * them imported yet. They make the worklist the ~200-entry atlas the console is
 * scoped for without pretending we hold data we do not.
 */
const ROADMAP = `
St. Anton am Arlberg|Tyrol, Austria|47.1287|10.2681
Ischgl|Tyrol, Austria|47.0111|10.2917
Sölden|Tyrol, Austria|46.9667|11.0075
Kitzbühel|Tyrol, Austria|47.4467|12.3917
Saalbach Hinterglemm|Salzburg, Austria|47.3925|12.6383
Mayrhofen|Tyrol, Austria|47.1667|11.8667
Obergurgl|Tyrol, Austria|46.8722|11.0264
Schladming|Styria, Austria|47.3939|13.6892
Zell am See|Salzburg, Austria|47.3250|12.7950
Serfaus-Fiss-Ladis|Tyrol, Austria|47.0400|10.6050
Zermatt|Valais, Switzerland|46.0207|7.7491
Verbier|Valais, Switzerland|46.0961|7.2286
St. Moritz|Grisons, Switzerland|46.4908|9.8355
Davos Klosters|Grisons, Switzerland|46.8027|9.8360
Laax|Grisons, Switzerland|46.8069|9.2586
Grindelwald-Wengen|Bern, Switzerland|46.6244|8.0413
Saas-Fee|Valais, Switzerland|46.1089|7.9289
Crans-Montana|Valais, Switzerland|46.3122|7.4800
Andermatt|Uri, Switzerland|46.6350|8.5942
Arosa Lenzerheide|Grisons, Switzerland|46.7833|9.6800
Cortina d'Ampezzo|Veneto, Italy|46.5405|12.1357
Livigno|Lombardy, Italy|46.5380|10.1350
Madonna di Campiglio|Trentino, Italy|46.2292|10.8267
Val Gardena|South Tyrol, Italy|46.5586|11.6764
Sestriere|Piedmont, Italy|44.9578|6.8781
Bormio|Lombardy, Italy|46.4675|10.3714
Alta Badia|South Tyrol, Italy|46.5583|11.8833
Serre Chevalier|Hautes-Alpes, France|44.9403|6.5533
Les Orres|Hautes-Alpes, France|44.5044|6.5539
Vars Risoul|Hautes-Alpes, France|44.5722|6.6867
Montgenèvre|Hautes-Alpes, France|44.9319|6.7247
Isola 2000|Alpes-Maritimes, France|44.1889|7.1550
Grand Tourmalet|Hautes-Pyrénées, France|42.9083|0.1450
Font-Romeu|Pyrénées-Orientales, France|42.5119|2.0403
Aspen Snowmass|Colorado, United States|39.2097|-106.9494
Park City|Utah, United States|40.6514|-111.5080
Jackson Hole|Wyoming, United States|43.5875|-110.8278
Big Sky|Montana, United States|45.2861|-111.4014
Mammoth Mountain|California, United States|37.6308|-119.0326
Breckenridge|Colorado, United States|39.4817|-106.0384
Steamboat|Colorado, United States|40.4572|-106.8045
Telluride|Colorado, United States|37.9375|-107.8123
Palisades Tahoe|California, United States|39.1969|-120.2358
Killington|Vermont, United States|43.6045|-72.8201
Banff Sunshine|Alberta, Canada|51.0781|-115.7767
Lake Louise|Alberta, Canada|51.4419|-116.1653
Revelstoke|British Columbia, Canada|50.9583|-118.1639
Mont Tremblant|Quebec, Canada|46.2094|-74.5850
Niseko United|Hokkaido, Japan|42.8556|140.6875
Hakuba Valley|Nagano, Japan|36.6983|137.8319
Rusutsu|Hokkaido, Japan|42.7411|140.9047
Nozawa Onsen|Nagano, Japan|36.9231|138.4453
Åre|Jämtland, Sweden|63.3986|13.0811
Trysil|Innlandet, Norway|61.2989|12.2653
Hemsedal|Buskerud, Norway|60.8617|8.5556
Bansko|Blagoevgrad, Bulgaria|41.8386|23.4886
`;

function num(v: string): number | null {
  const t = v.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseSnapshot(): SeedResort[] {
  return SNAPSHOT.trim()
    .split("\n")
    .map((line) => {
      const c = line.split("|");
      return {
        name: c[0],
        locationName: c[1].trim() === "" ? null : c[1].trim(),
        osmId: num(c[2]),
        lat: Number(c[3]),
        lng: Number(c[4]),
        baseAltitude: num(c[5]),
        summitAltitude: num(c[6]),
        trails: Number(c[7]),
        lifts: Number(c[8]),
        places: Number(c[9]),
        imported: true,
      };
    });
}

function parseRoadmap(): SeedResort[] {
  return ROADMAP.trim()
    .split("\n")
    .map((line) => {
      const c = line.split("|");
      return {
        name: c[0],
        locationName: c[1],
        osmId: null,
        lat: Number(c[2]),
        lng: Number(c[3]),
        baseAltitude: null,
        summitAltitude: null,
        trails: 0,
        lifts: 0,
        places: 0,
        imported: false,
      };
    });
}

export const SEED_RESORTS: SeedResort[] = [...parseSnapshot(), ...parseRoadmap()];

/**
 * Country and region for a seed row.
 *
 * The production snapshot has an empty `location_name` for every French row, so
 * the massif is derived from coordinates. The boxes are approximate and exist
 * only to give the worklist a sensible grouping axis — they are fixture data,
 * not a gazetteer, and nothing downstream depends on them being exact.
 */
export function classify(r: SeedResort): { country: string; region: string } {
  if (r.locationName) {
    const parts = r.locationName.split(",").map((p) => p.trim());
    return { country: parts[parts.length - 1], region: parts[0] };
  }
  const { lat, lng } = r;
  const region =
    lng < 3.9 ? "Forez" :
    lng < 4.5 ? (lat > 44.8 ? "Velay" : "Ardèche") :
    lng < 5.5 ? "Vercors" :
    lng < 5.8 ? (lat < 45.0 ? "Diois" : lat > 45.85 ? "Bugey" : "Vercors") :
    lng < 6.0 ? (lat > 45.55 ? "Bauges" : lat > 45.2 ? "Chartreuse" : "Oisans") :
    lng < 6.3 ? (lat > 45.55 ? "Bauges" : lat > 45.2 ? "Belledonne" : "Oisans") :
    lng < 6.55 ? (lat > 45.85 ? "Aravis" : lat > 45.6 ? "Beaufortain" : lat > 45.35 ? "Tarentaise" : "Maurienne") :
    lng < 6.9 ? (lat > 46.1 ? "Chablais" : lat > 45.75 ? "Mont-Blanc" : lat > 45.4 ? "Tarentaise" : "Maurienne") :
    (lat > 46.1 ? "Chablais" : lat > 45.85 ? "Mont-Blanc" : lat > 45.4 ? "Tarentaise" : "Maurienne");

  // The handful of cross-border entries in the snapshot.
  const country =
    r.name.startsWith("Courmayeur") || r.name.startsWith("La Thuile") ? "Italy" :
    r.name.startsWith("Champéry") || r.name === "Torgon" ? "Switzerland" :
    "France";

  return { country, region };
}
