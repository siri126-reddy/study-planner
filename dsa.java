import java.util.*;

public class dsa {

    // Task class for Heap (PriorityQueue)
    static class Task {
        String subject;
        int priority;

        Task(String subject, int priority) {
            this.subject = subject;
            this.priority = priority;
        }
    }

    // Subjects list
    static ArrayList<String> subjects =
            new ArrayList<>(Arrays.asList("DSA","HTML","ENGLISH","MATHS"));

    // Heap for study priority
    static PriorityQueue<Task> studyPlan =
            new PriorityQueue<>((a,b) -> b.priority - a.priority);

    static Scanner sc = new Scanner(System.in);

    // Show Subjects
    static void showSubjects() {

        System.out.println("\nSubjects List:");

        for(String s : subjects) {
            System.out.println("- " + s);
        }
    }

    // Add Study Task with Priority Validation
    static void addTask() {

        System.out.print("Enter subject: ");
        String s = sc.nextLine();

        int p;

        while(true) {

            System.out.print("Enter priority (1-10): ");
            p = sc.nextInt();
            sc.nextLine();

            if(p >= 1 && p <= 10) {
                break;
            }
            else {
                System.out.println("Invalid priority! Please enter only between 1 and 10.");
            }
        }

        studyPlan.add(new Task(s,p));

        System.out.println("Task added successfully.");
    }

    // Show Study Plan using Heap
    static void showPlan() {

        PriorityQueue<Task> temp = new PriorityQueue<>(studyPlan);

        System.out.println("\nStudy Plan (Priority Order):");

        while(!temp.isEmpty()) {

            Task t = temp.poll();

            System.out.println(t.subject +
                    " -> Priority: " + t.priority);
        }
    }

    // Weekly Timetable with changing subject order
    static void generateWeeklyTimetable() {

        String[] days =
                {"Monday","Tuesday","Wednesday","Thursday","Friday"};

        ArrayList<String> timetableSubjects =
                new ArrayList<>(subjects);

        System.out.println("\n===== WEEKLY TIMETABLE =====");

        for(int i=0;i<days.length;i++) {

            System.out.println("\n" + days[i]);

            int startTime = 9;

            for(String subject : timetableSubjects) {

                System.out.println(subject +
                        " -> " + startTime + ":00 - " +
                        (startTime+1) + ":00");

                startTime++;
            }

            // Rotate subjects for next day
            Collections.rotate(timetableSubjects,-1);
        }
    }

    public static void main(String[] args) {

        while(true) {

            System.out.println("\n===== STUDY PORTAL =====");
            System.out.println("1 Show Subjects");
            System.out.println("2 Add Study Task");
            System.out.println("3 Show Study Plan");
            System.out.println("4 Generate Weekly Timetable");
            System.out.println("5 Exit");

            System.out.print("Choose option: ");

            int choice = sc.nextInt();
            sc.nextLine();

            switch(choice) {

                case 1:
                    showSubjects();
                    break;

                case 2:
                    addTask();
                    break;

                case 3:
                    showPlan();
                    break;

                case 4:
                    generateWeeklyTimetable();
                    break;

                case 5:
                    System.out.println("Exiting program...");
                    return;

                default:
                    System.out.println("Invalid choice.");
            }
        }
    }
}
