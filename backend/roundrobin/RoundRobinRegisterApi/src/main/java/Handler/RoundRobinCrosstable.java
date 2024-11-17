package Handler;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * The type Round robin crosstable.
 */
public class RoundRobinCrosstable {

    private final RegisterManager actions = new RegisterManager();
    private final MongoCollection<Document> RRtournament;
    private MongoCollection<Document> RRplayercollection;

    private final String tournamentID;

    /**
     * Instantiates a new Round robin crosstable.
     *
     * @param RRtournament       the r rtournament
     * @param RRplayercollection the r rplayercollection
     * @param tournamentID       the tournament id
     */
    public RoundRobinCrosstable(MongoCollection<Document> RRtournament, MongoCollection<Document> RRplayercollection, String tournamentID) {
        this.RRtournament = RRtournament;
        this.RRplayercollection = RRplayercollection;
        this.tournamentID = tournamentID;
    }


    /**
     * Create cross table.
     */
    public void createCrossTable() {
        List<String> players = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("players", String.class);

        if (!players.isEmpty() && !(players.size() < 3)) {
            final int columnWidth = 12;
            String[][] crosstable = new String[players.size()][players.size()];
            StringBuilder builder = new StringBuilder();

            builder.append(String.format("%-" + columnWidth + "s", ""));
            for (int i = 1; i <= players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", "|" + i + "|"));
            }
            builder.append("\n");

            for (int i = 0; i < players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", players.get(i)));
                for (int j = 0; j < players.size(); j++) {
                    if (i == j) {
                        crosstable[i][j] = "X";
                    } else {
                        crosstable[i][j] = "-";
                    }
                    builder.append(String.format("%-" + columnWidth + "s", crosstable[i][j]));
                }
                builder.append("\n");
            }

            ArrayList<ArrayList<String>> crosstableList = new ArrayList<>();
            for (String[] strings : crosstable) {
                ArrayList<String> rowList = new ArrayList<>(Arrays.asList(strings));
                crosstableList.add(rowList);
            }

            System.out.println(builder.toString());

            actions.pushCrosstableString(RRtournament, builder.toString(), tournamentID);
            actions.pushCrossTableList(RRtournament, crosstableList, tournamentID);
        } else {
            System.out.println("Cross table can't be generated!");
        }
    }

    /**
     * Get tournament crosstable list.
     *
     * @return the list
     */
    public List<ArrayList<String>> getTournamentCrosstable(){

        List<?> rawList = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("crosstable-data", ArrayList.class);
        List<ArrayList<String>> tournamentCrosstable = new ArrayList<>();

        for (Object obj : rawList) {
            if (obj instanceof ArrayList<?>) {
                ArrayList<String> innerList = new ArrayList<>();
                for (Object innerObj : (ArrayList<?>) obj) {
                    if (innerObj instanceof String) {
                        innerList.add((String) innerObj);
                    } else {
                        throw new IllegalArgumentException("Expected inner list of strings but found: " + innerObj.getClass().getName());
                    }
                }
                tournamentCrosstable.add(innerList);
            } else {
                throw new IllegalArgumentException("Expected list of lists but found: " + obj.getClass().getName());
            }
        }

        return tournamentCrosstable;
    }


}
