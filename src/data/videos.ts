// Video resources for proper form
// Curated beginner-friendly videos focusing on technique

export interface VideoResource {
  title: string;
  url: string;
  duration?: string; // e.g., "2:30"
  channel: string;
}

// Exercise ID to video resources mapping
export const EXERCISE_VIDEOS: Record<string, VideoResource[]> = {
  // WARMUP
  'arm-circles': [
    {
      title: 'Arm Circles Warm Up',
      url: 'https://www.youtube.com/watch?v=140RTEvFr5M',
      duration: '0:30',
      channel: 'Howcast',
    },
  ],
  'hip-circles': [
    {
      title: 'Hip Circles Exercise',
      url: 'https://www.youtube.com/watch?v=bPVZx9RG1MA',
      duration: '1:00',
      channel: 'Howcast',
    },
  ],
  'march-in-place': [
    {
      title: 'Marching in Place',
      url: 'https://www.youtube.com/watch?v=d5_nQxCM4W0',
      duration: '0:45',
      channel: 'HASfit',
    },
  ],
  'jumping-jacks': [
    {
      title: 'How to Do Jumping Jacks',
      url: 'https://www.youtube.com/watch?v=c4DAnQ6DtF8',
      duration: '1:30',
      channel: 'Howcast',
    },
  ],
  'leg-swings': [
    {
      title: 'Leg Swings for Warm Up',
      url: 'https://www.youtube.com/watch?v=0R3wSxqYCSY',
      duration: '1:15',
      channel: 'ATHLEAN-X',
    },
  ],

  // UPPER BODY
  'wall-pushups': [
    {
      title: 'Wall Push Up for Beginners',
      url: 'https://www.youtube.com/watch?v=a6YHbXD2XlU',
      duration: '2:00',
      channel: 'Howcast',
    },
  ],
  'incline-pushups': [
    {
      title: 'Incline Push-Up Form',
      url: 'https://www.youtube.com/watch?v=cfns5VDVVvk',
      duration: '1:30',
      channel: 'ScottHermanFitness',
    },
  ],
  'knee-pushups': [
    {
      title: 'Knee Push-Ups Proper Form',
      url: 'https://www.youtube.com/watch?v=jWxvty2KROs',
      duration: '2:00',
      channel: 'LIVESTRONG.COM',
    },
  ],
  'full-pushups': [
    {
      title: 'Perfect Push-Up Form',
      url: 'https://www.youtube.com/watch?v=IODxDxX7oi4',
      duration: '5:30',
      channel: 'Jeff Nippard',
    },
  ],
  'kettlebell-rows-light': [
    {
      title: 'Single Arm Kettlebell Row',
      url: 'https://www.youtube.com/watch?v=7SDvHMbxgbE',
      duration: '2:30',
      channel: 'Mind Pump TV',
    },
  ],
  'kettlebell-rows': [
    {
      title: 'Single Arm Kettlebell Row',
      url: 'https://www.youtube.com/watch?v=7SDvHMbxgbE',
      duration: '2:30',
      channel: 'Mind Pump TV',
    },
  ],
  'kettlebell-rows-heavy': [
    {
      title: 'Heavy Kettlebell Row Tips',
      url: 'https://www.youtube.com/watch?v=7SDvHMbxgbE',
      duration: '2:30',
      channel: 'Mind Pump TV',
    },
  ],
  'overhead-press-light': [
    {
      title: 'Kettlebell Press for Beginners',
      url: 'https://www.youtube.com/watch?v=B7bqAsxee4I',
      duration: '3:00',
      channel: 'Mark Wildman',
    },
  ],
  'overhead-press': [
    {
      title: 'Kettlebell Press Technique',
      url: 'https://www.youtube.com/watch?v=B7bqAsxee4I',
      duration: '3:00',
      channel: 'Mark Wildman',
    },
  ],
  'push-press': [
    {
      title: 'Kettlebell Push Press',
      url: 'https://www.youtube.com/watch?v=9Y3IQ-4PQ8g',
      duration: '2:30',
      channel: 'Onnit',
    },
  ],
  'dead-bugs-basic': [
    {
      title: 'Dead Bug Exercise for Beginners',
      url: 'https://www.youtube.com/watch?v=I5xbsA71v1A',
      duration: '3:00',
      channel: 'Precision Movement',
    },
  ],
  'dead-bugs': [
    {
      title: 'Dead Bug Exercise',
      url: 'https://www.youtube.com/watch?v=I5xbsA71v1A',
      duration: '3:00',
      channel: 'Precision Movement',
    },
  ],
  'plank-shoulder-taps': [
    {
      title: 'Plank Shoulder Taps',
      url: 'https://www.youtube.com/watch?v=LEZq7QZ8ySQ',
      duration: '1:30',
      channel: 'POPSUGAR Fitness',
    },
  ],
  'renegade-rows': [
    {
      title: 'Renegade Row Form',
      url: 'https://www.youtube.com/watch?v=rYgNArpwE7g',
      duration: '2:00',
      channel: 'ScottHermanFitness',
    },
  ],
  'hollow-body-hold': [
    {
      title: 'Hollow Body Hold Tutorial',
      url: 'https://www.youtube.com/watch?v=LlDNef_Ztsc',
      duration: '4:00',
      channel: 'THENX',
    },
  ],

  // LOWER BODY
  'bodyweight-squats': [
    {
      title: 'Perfect Bodyweight Squat Form',
      url: 'https://www.youtube.com/watch?v=aclHkVaku9U',
      duration: '6:00',
      channel: 'Jeremy Ethier',
    },
  ],
  'goblet-squats': [
    {
      title: 'Goblet Squat for Beginners',
      url: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
      duration: '3:30',
      channel: 'Mind Pump TV',
    },
  ],
  'goblet-squats-heavy': [
    {
      title: 'Goblet Squat Technique',
      url: 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
      duration: '3:30',
      channel: 'Mind Pump TV',
    },
  ],
  'sumo-squats': [
    {
      title: 'Sumo Squat Form',
      url: 'https://www.youtube.com/watch?v=9ZuXKqRbT9k',
      duration: '2:30',
      channel: 'Fitness Blender',
    },
  ],
  'romanian-deadlift': [
    {
      title: 'Romanian Deadlift for Beginners',
      url: 'https://www.youtube.com/watch?v=JCXUYuzwNrM',
      duration: '5:00',
      channel: 'Jeremy Ethier',
    },
  ],
  'single-leg-rdl': [
    {
      title: 'Single Leg RDL Tutorial',
      url: 'https://www.youtube.com/watch?v=Dus3bD2UCLU',
      duration: '4:00',
      channel: 'Mind Pump TV',
    },
  ],
  'kettlebell-deadlift': [
    {
      title: 'Kettlebell Deadlift Form',
      url: 'https://www.youtube.com/watch?v=sP_4vybjVJs',
      duration: '3:00',
      channel: 'Onnit',
    },
  ],
  'glute-bridges-basic': [
    {
      title: 'Glute Bridge for Beginners',
      url: 'https://www.youtube.com/watch?v=wPM8icPu6H8',
      duration: '2:00',
      channel: 'Bowflex',
    },
  ],
  'glute-bridges': [
    {
      title: 'Glute Bridge Technique',
      url: 'https://www.youtube.com/watch?v=wPM8icPu6H8',
      duration: '2:00',
      channel: 'Bowflex',
    },
  ],
  'single-leg-bridge': [
    {
      title: 'Single Leg Glute Bridge',
      url: 'https://www.youtube.com/watch?v=AVAXhy6pl7o',
      duration: '1:30',
      channel: 'Howcast',
    },
  ],
  'standing-calf-raises': [
    {
      title: 'Calf Raises at Home',
      url: 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
      duration: '2:00',
      channel: 'ScottHermanFitness',
    },
  ],
  'step-ups': [
    {
      title: 'Step Up Exercise Form',
      url: 'https://www.youtube.com/watch?v=dQqApCGd5Ss',
      duration: '2:30',
      channel: 'Bowflex',
    },
  ],
  'lunges': [
    {
      title: 'Lunge Form for Beginners',
      url: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
      duration: '3:00',
      channel: 'Bowflex',
    },
  ],
  'reverse-lunges': [
    {
      title: 'Reverse Lunge Technique',
      url: 'https://www.youtube.com/watch?v=xrPteyQLGAo',
      duration: '2:30',
      channel: 'Bowflex',
    },
  ],
  'walking-lunges': [
    {
      title: 'Walking Lunge Form',
      url: 'https://www.youtube.com/watch?v=L8fvypPrzzs',
      duration: '2:00',
      channel: 'ScottHermanFitness',
    },
  ],
  'jump-squats': [
    {
      title: 'Jump Squat Tutorial',
      url: 'https://www.youtube.com/watch?v=A-cFYWvaHr0',
      duration: '1:30',
      channel: 'LIVESTRONG.COM',
    },
  ],

  // FULL BODY
  'squat-to-stand': [
    {
      title: 'Squat to Stand Mobility',
      url: 'https://www.youtube.com/watch?v=B22PqSY7yDg',
      duration: '1:30',
      channel: 'MovementRx',
    },
  ],
  'bird-dogs': [
    {
      title: 'Bird Dog Exercise Form',
      url: 'https://www.youtube.com/watch?v=wiFNA3sqjCA',
      duration: '2:30',
      channel: 'SpineCare Decompression',
    },
  ],
  'plank-hold-basic': [
    {
      title: 'Plank for Beginners',
      url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      duration: '4:00',
      channel: 'ATHLEAN-X',
    },
  ],
  'plank-hold': [
    {
      title: 'Perfect Plank Form',
      url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
      duration: '4:00',
      channel: 'ATHLEAN-X',
    },
  ],
  'plank-reaches': [
    {
      title: 'Plank Reaches Exercise',
      url: 'https://www.youtube.com/watch?v=x2vRTPCfkTY',
      duration: '1:00',
      channel: 'SportsRec',
    },
  ],
  'kettlebell-swings': [
    {
      title: 'Kettlebell Swing for Beginners',
      url: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
      duration: '8:00',
      channel: 'Mark Wildman',
    },
    {
      title: 'Kettlebell Swing Tutorial',
      url: 'https://www.youtube.com/watch?v=mKDIuUbH94Q',
      duration: '5:00',
      channel: 'Onnit',
    },
  ],
  'kettlebell-swings-heavy': [
    {
      title: 'Heavy Kettlebell Swing',
      url: 'https://www.youtube.com/watch?v=YSxHifyI6s8',
      duration: '8:00',
      channel: 'Mark Wildman',
    },
  ],
  'goblet-squat-to-press': [
    {
      title: 'Goblet Squat to Press',
      url: 'https://www.youtube.com/watch?v=2LBwq6Jzk4Y',
      duration: '2:00',
      channel: 'Onnit',
    },
  ],
  'single-arm-farmers-carry': [
    {
      title: 'Suitcase Carry Form',
      url: 'https://www.youtube.com/watch?v=t-8K6-bJpac',
      duration: '3:00',
      channel: 'Mind Pump TV',
    },
  ],
  'kb-clean-and-press': [
    {
      title: 'Kettlebell Clean and Press',
      url: 'https://www.youtube.com/watch?v=7hWO_Px6ung',
      duration: '4:00',
      channel: 'Onnit',
    },
  ],
  'kb-swing-to-squat': [
    {
      title: 'Swing to Goblet Squat',
      url: 'https://www.youtube.com/watch?v=dJVL7oeRLg8',
      duration: '2:00',
      channel: 'Onnit',
    },
  ],
  'turkish-getup': [
    {
      title: 'Turkish Get Up for Beginners',
      url: 'https://www.youtube.com/watch?v=0bWRPC6GbWc',
      duration: '10:00',
      channel: 'Mark Wildman',
    },
    {
      title: 'Turkish Get Up Breakdown',
      url: 'https://www.youtube.com/watch?v=OgBfNGNlnlU',
      duration: '5:00',
      channel: 'Onnit',
    },
  ],
  'burpees-basic': [
    {
      title: 'Beginner Burpee Modifications',
      url: 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
      duration: '3:00',
      channel: 'POPSUGAR Fitness',
    },
  ],

  // COOLDOWN / STRETCHING
  'deep-breathing': [
    {
      title: 'Box Breathing Technique',
      url: 'https://www.youtube.com/watch?v=tEmt1Znux58',
      duration: '5:00',
      channel: 'Mark Divine',
    },
  ],
  'standing-forward-fold': [
    {
      title: 'Standing Forward Fold',
      url: 'https://www.youtube.com/watch?v=HqBg7jQDnOA',
      duration: '2:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'childs-pose': [
    {
      title: 'Child\'s Pose Tutorial',
      url: 'https://www.youtube.com/watch?v=eqVMAPM00DM',
      duration: '3:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'seated-side-stretch': [
    {
      title: 'Seated Side Stretch',
      url: 'https://www.youtube.com/watch?v=JgZU1QwFdV4',
      duration: '1:30',
      channel: 'AskDoctorJo',
    },
  ],
  'supine-spinal-twist': [
    {
      title: 'Supine Twist Stretch',
      url: 'https://www.youtube.com/watch?v=HsoLhT8v_Mw',
      duration: '2:00',
      channel: 'Yoga With Adriene',
    },
  ],

  // LIGHT DAY - MOBILITY
  'cat-cow': [
    {
      title: 'Cat-Cow Stretch',
      url: 'https://www.youtube.com/watch?v=kqnua4rHVVA',
      duration: '3:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'thread-the-needle': [
    {
      title: 'Thread the Needle Stretch',
      url: 'https://www.youtube.com/watch?v=1kfhmHMjKvI',
      duration: '2:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'supine-twist': [
    {
      title: 'Supine Spinal Twist',
      url: 'https://www.youtube.com/watch?v=HsoLhT8v_Mw',
      duration: '2:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'figure-four-stretch': [
    {
      title: 'Figure Four Stretch',
      url: 'https://www.youtube.com/watch?v=d8xPBvk0T48',
      duration: '2:30',
      channel: 'AskDoctorJo',
    },
  ],
  'wall-angels': [
    {
      title: 'Wall Angels for Posture',
      url: 'https://www.youtube.com/watch?v=M_ooIhKYs7c',
      duration: '3:00',
      channel: 'Bob & Brad',
    },
  ],

  // YOGA
  'downward-dog': [
    {
      title: 'Downward Dog for Beginners',
      url: 'https://www.youtube.com/watch?v=EC7RGJ975iM',
      duration: '4:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'low-lunge': [
    {
      title: 'Low Lunge Pose',
      url: 'https://www.youtube.com/watch?v=1LyyjKsgmPo',
      duration: '2:30',
      channel: 'Yoga With Adriene',
    },
  ],
  'seated-forward-fold': [
    {
      title: 'Seated Forward Fold',
      url: 'https://www.youtube.com/watch?v=t1XS8E2S6qU',
      duration: '3:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'gentle-twist': [
    {
      title: 'Seated Twist Pose',
      url: 'https://www.youtube.com/watch?v=fwLPvLK7Y_4',
      duration: '2:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'savasana': [
    {
      title: 'Savasana (Corpse Pose)',
      url: 'https://www.youtube.com/watch?v=1VYlOKUdylM',
      duration: '5:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'savasana-extended': [
    {
      title: 'Guided Savasana',
      url: 'https://www.youtube.com/watch?v=1VYlOKUdylM',
      duration: '5:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'sun-salutation-a': [
    {
      title: 'Sun Salutation A for Beginners',
      url: 'https://www.youtube.com/watch?v=73sjOu0g58M',
      duration: '10:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'warrior-1': [
    {
      title: 'Warrior I Pose',
      url: 'https://www.youtube.com/watch?v=5VWw2VXlxM8',
      duration: '3:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'warrior-2': [
    {
      title: 'Warrior II Pose',
      url: 'https://www.youtube.com/watch?v=Mn6RSIRCV3w',
      duration: '3:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'triangle': [
    {
      title: 'Triangle Pose',
      url: 'https://www.youtube.com/watch?v=S6gB0QHbWFE',
      duration: '4:00',
      channel: 'Yoga With Adriene',
    },
  ],
  'pigeon': [
    {
      title: 'Pigeon Pose for Beginners',
      url: 'https://www.youtube.com/watch?v=FRzNDQ9brmI',
      duration: '5:00',
      channel: 'Yoga With Adriene',
    },
  ],
};

// Recommended full workout channels for overall learning
export const RECOMMENDED_CHANNELS = [
  {
    name: 'Mark Wildman',
    url: 'https://www.youtube.com/@MarkWildman',
    specialty: 'Kettlebell technique and programming',
    description: 'Excellent deep-dive tutorials on kettlebell fundamentals',
  },
  {
    name: 'Onnit',
    url: 'https://www.youtube.com/@Onnit',
    specialty: 'Kettlebell and functional training',
    description: 'Great beginner-friendly kettlebell tutorials',
  },
  {
    name: 'Yoga With Adriene',
    url: 'https://www.youtube.com/@yogawithadriene',
    specialty: 'Yoga for all levels',
    description: 'Friendly, accessible yoga tutorials',
  },
  {
    name: 'Nourish Move Love',
    url: 'https://www.youtube.com/@NourishMoveLove',
    specialty: 'Home workouts for women',
    description: 'Beginner-friendly full workouts',
  },
  {
    name: 'Mind Pump TV',
    url: 'https://www.youtube.com/@MindPumpTV',
    specialty: 'Strength training form',
    description: 'Clear, detailed form breakdowns',
  },
];

// Get videos for an exercise
export function getVideosForExercise(exerciseId: string): VideoResource[] {
  return EXERCISE_VIDEOS[exerciseId] || [];
}
