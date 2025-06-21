import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { InputSection } from '@/components/InputSection';
import { TaskDisplay } from '@/components/TaskDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProgressDisplay } from '@/components/ProgressDisplay';
import { RewardNotification } from '@/components/RewardNotification';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';
import { GeminiApiService, type TaskGenerationRequest } from '@/utils/geminiApi';

const Tasks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [inputType, setInputType] = useState<'concept' | 'transcript'>('concept');
  const [showRewards, setShowRewards] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);
  const { toast } = useToast();
  const { userProgress, completeTask, getXpForNextLevel } = useGamification();

  const handleInputSubmit = async (input: string) => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a concept or transcript to generate tasks.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Processing input:', input, 'Type:', inputType);
    
    try {
      const request: TaskGenerationRequest = {
        input: input.trim(),
        inputType,
        skillLevel: 'beginner',
        userPreferences: []
      };

      const generatedTasks = await GeminiApiService.generateTasks(request);
      console.log('Generated tasks:', generatedTasks);
      
      setTasks(generatedTasks);
      
      toast({
        title: "Tasks Generated!",
        description: `Generated ${generatedTasks.length} personalized learning tasks using AI.`,
      });
    } catch (error) {
      console.error('Error generating tasks:', error);
      
      const mockTasks = [
        {
          id: 'mock_1',
          title: `Introduction to ${input}`,
          description: `Learn the fundamentals and core concepts of ${input}`,
          difficulty: 'Beginner',
          estimatedTime: '15 minutes',
          type: 'Reading'
        },
        {
          id: 'mock_2',
          title: `Practical Application of ${input}`,
          description: `Apply your knowledge through hands-on exercises`,
          difficulty: 'Intermediate',
          estimatedTime: '30 minutes',
          type: 'Exercise'
        },
        {
          id: 'mock_3',
          title: `Advanced ${input} Techniques`,
          description: `Master advanced concepts and best practices`,
          difficulty: 'Advanced',
          estimatedTime: '45 minutes',
          type: 'Project'
        }
      ];
      
      setTasks(mockTasks);
      
      toast({
        title: "Using Fallback Tasks",
        description: "API temporarily unavailable. Showing sample tasks instead.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTaskComplete = (taskTitle: string) => {
    const result = completeTask('learning');
    
    // Show reward notification
    setRewardData({
      ...result,
      newLevel: userProgress.level
    });
    setShowRewards(true);
    
    let toastMessage = `Great job! You earned ${result.reward.points} points, ${result.reward.xp} XP, and ${result.reward.coins} coins!`;
    
    if (result.levelUp) {
      toastMessage += ` 🎉 Level up to ${userProgress.level + 1}!`;
    }
    
    if (result.unlockedAchievements.length > 0) {
      toastMessage += ` 🏆 ${result.unlockedAchievements.length} new achievement${result.unlockedAchievements.length > 1 ? 's' : ''} unlocked!`;
    }

    toast({
      title: "Task Completed!",
      description: toastMessage,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ProgressDisplay 
            userProgress={userProgress}
            getXpForNextLevel={getXpForNextLevel}
          />

          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Learning Tasks
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Generate personalized learning tasks and earn rewards for your progress
            </p>
          </div>

          <InputSection
            onSubmit={handleInputSubmit}
            inputType={inputType}
            onInputTypeChange={setInputType}
            isLoading={isLoading}
          />

          {isLoading && <LoadingSpinner />}

          {tasks.length > 0 && !isLoading && (
            <TaskDisplay tasks={tasks} onTaskComplete={handleTaskComplete} />
          )}
        </div>
      </main>

      {showRewards && rewardData && (
        <RewardNotification
          reward={rewardData.reward}
          unlockedAchievements={rewardData.unlockedAchievements}
          levelUp={rewardData.levelUp}
          newLevel={rewardData.newLevel}
          onClose={() => setShowRewards(false)}
        />
      )}
    </div>
  );
};

export default Tasks;
