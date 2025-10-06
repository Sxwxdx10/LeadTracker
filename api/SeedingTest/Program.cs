using System;
using System.Collections.Generic;
using System.Linq;

// Simple test model to verify our seeding logic
public class Stage
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
}

public class Lead
{
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid StageId { get; set; }
}

namespace SeedingTest
{
    public class Program
    {
        public static void TestStatusStageConsistency()
        {
            Console.WriteLine("Testing Status-Stage Consistency Logic");
            Console.WriteLine("=====================================");

            // Simulate database stages (matching your current DB structure)
            var stages = new List<Stage>
            {
                new Stage { Id = Guid.NewGuid(), Name = "New Lead", Order = 1 },
                new Stage { Id = Guid.NewGuid(), Name = "Qualified", Order = 2 },
                new Stage { Id = Guid.NewGuid(), Name = "Proposal", Order = 3 },
                new Stage { Id = Guid.NewGuid(), Name = "Won", Order = 4 },
                new Stage { Id = Guid.NewGuid(), Name = "Lost", Order = 5 }
            };

            var random = new Random();
            var leads = new List<Lead>();

            // Generate 100 test leads using the corrected logic
            for (int i = 0; i < 100; i++)
            {
                var stageStatusChoice = random.Next(100);
                Stage selectedStage;
                string selectedStatus;

                if (stageStatusChoice < 60) // 60% chance for active leads (Open status)
                {
                    // Select from active stages only (exclude Won/Lost stages)
                    var activeStages = stages.Where(s => s.Name != "Won" && s.Name != "Lost" && 
                                                          s.Name != "Fermé - Gagné" && s.Name != "Fermé - Perdu").ToList();
                    selectedStage = activeStages[random.Next(activeStages.Count)];
                    selectedStatus = "Open";
                }
                else if (stageStatusChoice < 80) // 20% chance for Won leads
                {
                    // Force status to "Won" and assign to Won stage (check both English and French names)
                    selectedStage = stages.FirstOrDefault(s => s.Name == "Won" || s.Name == "Fermé - Gagné");
                    selectedStatus = "Won";
                }
                else // 20% chance for Lost leads
                {
                    // Force status to "Lost" and assign to Lost stage (check both English and French names)
                    selectedStage = stages.FirstOrDefault(s => s.Name == "Lost" || s.Name == "Fermé - Perdu");
                    selectedStatus = "Lost";
                }

                leads.Add(new Lead
                {
                    Title = $"Test Lead {i}",
                    Status = selectedStatus,
                    StageId = selectedStage.Id
                });
            }

            // Group and count status-stage combinations
            var statusStageCombinations = leads
                .Join(stages, l => l.StageId, s => s.Id, (l, s) => new { l.Status, StageName = s.Name })
                .GroupBy(x => new { x.Status, x.StageName })
                .OrderBy(g => g.Key.Status)
                .ThenBy(g => g.Key.StageName);

            Console.WriteLine("Status-Stage Distribution:");
            foreach (var group in statusStageCombinations)
            {
                Console.WriteLine($"  {group.Key.Status} | {group.Key.StageName} | Count: {group.Count()}");
            }

            // Check for inconsistencies
            Console.WriteLine("\nChecking for inconsistencies:");
            var inconsistentLeads = leads
                .Join(stages, l => l.StageId, s => s.Id, (l, s) => new { l.Status, StageName = s.Name })
                .Where(x => 
                    (x.Status == "Open" && (x.StageName == "Won" || x.StageName == "Lost" || x.StageName == "Fermé - Gagné" || x.StageName == "Fermé - Perdu")) ||
                    (x.Status == "Won" && x.StageName != "Won" && x.StageName != "Fermé - Gagné") ||
                    (x.Status == "Lost" && x.StageName != "Lost" && x.StageName != "Fermé - Perdu"));

            if (inconsistentLeads.Any())
            {
                Console.WriteLine($"  Found {inconsistentLeads.Count()} inconsistent leads:");
                foreach (var inconsistent in inconsistentLeads.Take(5))
                {
                    Console.WriteLine($"    Status: {inconsistent.Status} | Stage: {inconsistent.StageName}");
                }
            }
            else
            {
                Console.WriteLine("  No inconsistencies found! ✅");
            }

            var totalLeads = leads.Count;
            var openLeads = leads.Count(l => l.Status == "Open");
            var wonLeads = leads.Count(l => l.Status == "Won");
            var lostLeads = leads.Count(l => l.Status == "Lost");

            Console.WriteLine($"\nSummary:");
            Console.WriteLine($"  Total leads: {totalLeads}");
            Console.WriteLine($"  Open leads: {openLeads} ({openLeads * 100.0 / totalLeads:F1}%)");
            Console.WriteLine($"  Won leads: {wonLeads} ({wonLeads * 100.0 / totalLeads:F1}%)");
            Console.WriteLine($"  Lost leads: {lostLeads} ({lostLeads * 100.0 / totalLeads:F1}%)");
        }

        public static void Main(string[] args)
        {
            TestStatusStageConsistency();
        }
    }
}