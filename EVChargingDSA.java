import java.util.*;

// Station Class
class Station {
    String name;
    String city;
    boolean available;

    Station(String name, String city, boolean available) {
        this.name = name;
        this.city = city;
        this.available = available;
    }

    void display() {
        System.out.println(name + " | " + city + " | " +
                (available ? "Available" : "Not Available"));
    }
}

// Edge class for Graph
class Edge {
    int node, weight;

    Edge(int node, int weight) {
        this.node = node;
        this.weight = weight;
    }
}

public class EVChargingDSA {

    static HashMap<String, ArrayList<Station>> cityMap = new HashMap<>();
    static TreeMap<String, Station> sortedMap = new TreeMap<>();
    static ArrayList<ArrayList<Edge>> graph = new ArrayList<>();

    public static void main(String[] args) {

        // Sample Stations
        addStation(new Station("EV Power Hub", "Hyderabad", true));
        addStation(new Station("Green Charge", "Warangal", false));
        addStation(new Station("FastVolt", "Karimnagar", true));
        addStation(new Station("ChargePoint", "Hyderabad", true));

        Scanner sc = new Scanner(System.in);

        while (true) {

            System.out.println("\n===== EV Charging Station Locator =====");
            System.out.println("1. Search by City (HashMap)");
            System.out.println("2. Show All Sorted (TreeMap)");
            System.out.println("3. Show Available First (PriorityQueue)");
            System.out.println("4. Find Nearest Station (Dijkstra)");
            System.out.println("5. Exit");

            System.out.print("Enter choice: ");
            int choice = sc.nextInt();
            sc.nextLine();

            switch (choice) {

                case 1:
                    System.out.print("Enter city: ");
                    String city = sc.nextLine().toLowerCase();
                    searchByCity(city);
                    break;

                case 2:
                    showSorted();
                    break;

                case 3:
                    showPriority();
                    break;

                case 4:
                    runDijkstra();
                    break;

                case 5:
                    System.out.println("Exiting...");
                    return;

                default:
                    System.out.println("Invalid choice!");
            }
        }
    }

    // Add station
    static void addStation(Station s) {
        cityMap.putIfAbsent(s.city.toLowerCase(), new ArrayList<>());
        cityMap.get(s.city.toLowerCase()).add(s);
        sortedMap.put(s.name, s);
    }

    // Search by City
    static void searchByCity(String city) {
        if (!cityMap.containsKey(city)) {
            System.out.println("No stations found.");
            return;
        }

        System.out.println("\nStations in " + city.toUpperCase() + ":");
        for (Station s : cityMap.get(city)) {
            s.display();
        }
    }

    // Show Sorted Stations
    static void showSorted() {
        System.out.println("\nAll Stations (Sorted by Name):");
        for (Station s : sortedMap.values()) {
            s.display();
        }
    }

    // PriorityQueue (Available First)
    static void showPriority() {

        PriorityQueue<Station> pq =
                new PriorityQueue<>((a, b) ->
                        Boolean.compare(b.available, a.available));

        for (ArrayList<Station> list : cityMap.values())
            pq.addAll(list);

        System.out.println("\nStations (Available First):");
        while (!pq.isEmpty())
            pq.poll().display();
    }

    // Graph + Dijkstra
    static void runDijkstra() {

        int V = 4;
        graph.clear();

        for (int i = 0; i < V; i++)
            graph.add(new ArrayList<>());

        // Sample connections
        graph.get(0).add(new Edge(1, 5));
        graph.get(0).add(new Edge(2, 10));
        graph.get(1).add(new Edge(3, 3));
        graph.get(2).add(new Edge(3, 1));

        dijkstra(0);
    }

    static void dijkstra(int src) {

        int n = graph.size();
        int[] dist = new int[n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[src] = 0;

        PriorityQueue<Edge> pq =
                new PriorityQueue<>(Comparator.comparingInt(e -> e.weight));

        pq.add(new Edge(src, 0));

        while (!pq.isEmpty()) {

            Edge curr = pq.poll();

            for (Edge e : graph.get(curr.node)) {
                if (dist[curr.node] + e.weight < dist[e.node]) {
                    dist[e.node] = dist[curr.node] + e.weight;
                    pq.add(new Edge(e.node, dist[e.node]));
                }
            }
        }

        System.out.println("\nShortest Distance from Station 0:");
        for (int i = 0; i < n; i++)
            System.out.println("To Station " + i + " = " + dist[i]);
    }
}