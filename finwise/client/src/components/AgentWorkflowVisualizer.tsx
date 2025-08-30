import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Brain,
  Crown,
  Calculator,
  TrendingUp,
  PiggyBank,
  GraduationCap,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  icon: typeof Crown;
  status: string;
  color: string;
}

export function AgentWorkflowVisualizer() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: "master",
      name: "Master Strategist",
      icon: Crown,
      status: "Coordinating analysis...",
      color: "hsl(158 64% 52%)",
    },
    {
      id: "budget",
      name: "Budget Planner",
      icon: Calculator,
      status: "Active",
      color: "hsl(221 83% 53%)",
    },
    {
      id: "investment",
      name: "Investment Advisor",
      icon: TrendingUp,
      status: "Analyzing",
      color: "hsl(46 95% 53%)",
    },
    {
      id: "debt",
      name: "Debt Optimizer",
      icon: PiggyBank,
      status: "Idle",
      color: "hsl(0 84% 60%)",
    },
    {
      id: "education",
      name: "Financial Educator",
      icon: GraduationCap,
      status: "Ready",
      color: "hsl(271 81% 56%)",
    },
  ]);

  useEffect(() => {
    const statuses = [
      "Active",
      "Analyzing",
      "Idle",
      "Ready",
      "Processing",
      "Complete",
    ];

    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === "master") return agent;

          if (Math.random() > 0.7) {
            const randomStatus =
              statuses[Math.floor(Math.random() * statuses.length)];
            return { ...agent, status: randomStatus };
          }
          return agent;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">
        AI Agent Network
      </h3>
      <div className="space-y-4">
        {/* Master Agent */}
        <motion.div
          className="bg-secondary rounded-lg p-4 relative"
          animate={{
            boxShadow: [
              "0 0 5px hsl(158 64% 52% / 0.5)",
              "0 0 20px hsl(158 64% 52% / 0.8)",
              "0 0 5px hsl(158 64% 52% / 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          data-testid="agent-master"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-medium text-sm">{agents[0].name}</div>
              <div className="text-xs text-muted-foreground">
                {agents[0].status}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Workflow Connection Lines */}
        <div className="ml-4 space-y-3">
          <motion.div
            className="h-8 flex items-center relative overflow-hidden"
            data-testid="workflow-connection"
          >
            <div className="w-full h-px bg-border"></div>
            <motion.div
              className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{ transform: "translateY(-50%)" }}
            />
          </motion.div>

          {/* Sub-agents */}
          <div className="grid grid-cols-1 gap-3">
            {agents.slice(1).map((agent, index) => (
              <motion.div
                key={agent.id}
                className="bg-accent rounded-lg p-3"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                data-testid={`agent-${agent.id}`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: agent.color }}
                  >
                    <agent.icon className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-xs">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.status}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
