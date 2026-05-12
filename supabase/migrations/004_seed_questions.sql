-- =========================================================================
-- MAP Test System - Seed question bank
-- 50+ Math questions and 50+ English questions covering RIT 140-250
-- =========================================================================

-- ============================ MATH ============================
INSERT INTO questions
(subject, strand, grade_band, difficulty_rit,
 question_text, passage_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation)
VALUES
-- RIT 140-160 (K-1)
('math','number_operations',0,140,'What is 2 + 1?',NULL,'1','2','3','4','C','Two plus one equals three.'),
('math','number_operations',0,142,'How many fingers are on one hand?',NULL,'3','4','5','6','C','A hand has five fingers.'),
('math','number_operations',0,145,'What number comes after 7?',NULL,'6','8','9','10','B','Counting in order, 8 comes right after 7.'),
('math','geometry',0,148,'Which shape has 3 sides?',NULL,'Square','Circle','Triangle','Rectangle','C','A triangle has exactly three sides.'),
('math','number_operations',1,150,'What is 5 - 2?',NULL,'1','2','3','4','C','Five take away two leaves three.'),
('math','number_operations',1,155,'9 + 1 = ?',NULL,'8','9','10','11','C','Adding one to nine equals ten.'),
('math','measurement_data',1,158,'Which is longer?',NULL,'1 cm','1 meter','1 mm','1 inch','B','A meter is the longest of these units.'),
('math','number_operations',1,160,'What is 3 + 4?',NULL,'6','7','8','9','B','Three plus four equals seven.'),

-- RIT 160-185 (Gr 1-3)
('math','number_operations',2,162,'8 - 3 = ?',NULL,'4','5','6','7','B','Eight minus three is five.'),
('math','operations_algebraic',2,165,'If 6 + ? = 10, what is ??',NULL,'2','3','4','5','C','Ten minus six is four.'),
('math','number_operations',2,168,'What is 12 + 7?',NULL,'18','19','20','21','B','12 plus 7 equals 19.'),
('math','geometry',2,170,'How many sides does a hexagon have?',NULL,'4','5','6','8','C','A hexagon has six sides.'),
('math','number_operations',2,172,'What is 5 x 2?',NULL,'7','10','12','15','B','Five times two equals ten.'),
('math','measurement_data',3,175,'How many minutes are in 1 hour?',NULL,'30','45','60','100','C','One hour contains sixty minutes.'),
('math','operations_algebraic',3,178,'What is 9 x 3?',NULL,'24','25','27','29','C','Nine times three is twenty-seven.'),
('math','number_operations',3,180,'What is 45 + 23?',NULL,'58','66','68','78','C','45 plus 23 equals 68.'),
('math','number_operations',3,182,'What is 100 - 37?',NULL,'53','63','67','73','B','100 minus 37 equals 63.'),
('math','operations_algebraic',3,185,'Find x: x + 8 = 15',NULL,'5','6','7','8','C','15 minus 8 is 7.'),

-- RIT 185-210 (Gr 3-5)
('math','number_operations',4,188,'What is 6 x 7?',NULL,'36','42','48','49','B','Six times seven equals 42.'),
('math','number_operations',4,190,'What is 56 ÷ 8?',NULL,'6','7','8','9','B','56 divided by 8 equals 7.'),
('math','ratios_proportions',4,193,'1/2 + 1/4 = ?',NULL,'1/6','1/8','3/4','5/8','C','One half is 2/4, plus 1/4 equals 3/4.'),
('math','number_operations',4,195,'What is 125 + 76?',NULL,'191','201','211','221','B','125 + 76 = 201.'),
('math','measurement_data',5,198,'What is the area of a 5 x 8 rectangle?',NULL,'13 sq units','26 sq units','40 sq units','45 sq units','C','Area equals length times width: 5 x 8 = 40.'),
('math','ratios_proportions',5,200,'Convert 3/5 to a decimal.',NULL,'0.3','0.35','0.6','0.65','C','3 divided by 5 equals 0.6.'),
('math','operations_algebraic',5,202,'Solve: 2x = 14',NULL,'5','6','7','8','C','Divide both sides by 2: x = 7.'),
('math','number_operations',5,205,'What is 0.4 x 0.5?',NULL,'0.02','0.2','0.9','2.0','B','Four tenths of a half is two tenths.'),
('math','geometry',5,208,'A right angle measures:',NULL,'45°','90°','120°','180°','B','A right angle is exactly 90 degrees.'),
('math','statistics_probability',5,210,'What is the median of 3, 7, 5, 9, 1?',NULL,'1','3','5','7','C','Ordered: 1,3,5,7,9. The middle is 5.'),

-- RIT 210-225 (Gr 6-7)
('math','operations_algebraic',6,212,'Simplify: 3(x + 4) - 2x',NULL,'x + 4','x + 12','5x + 4','5x + 12','B','3x + 12 - 2x = x + 12.'),
('math','ratios_proportions',6,215,'If 4 pens cost $5, how much do 12 pens cost?',NULL,'$12','$15','$18','$20','B','12 pens is 3 times 4 pens, so 3 × $5 = $15.'),
('math','number_operations',6,217,'What is -7 + 12?',NULL,'-19','-5','5','19','C','12 minus 7 equals 5.'),
('math','statistics_probability',6,220,'A bag has 3 red and 7 blue marbles. P(red) = ?',NULL,'3/7','3/10','7/10','1/3','B','Red over total: 3 out of 10.'),
('math','geometry',7,222,'The volume of a cube with side 4 is:',NULL,'12','16','48','64','D','Side cubed: 4³ = 64.'),
('math','operations_algebraic',7,224,'Solve: 5x - 3 = 22',NULL,'4','5','6','7','B','Add 3, divide by 5: x = 5.'),

-- RIT 225-245 (Gr 8-10)
('math','functions',8,226,'If f(x) = 2x + 1, what is f(3)?',NULL,'5','6','7','8','C','2(3) + 1 = 7.'),
('math','operations_algebraic',8,228,'Solve: 3(x - 2) = 12',NULL,'4','6','8','10','B','x - 2 = 4, so x = 6.'),
('math','geometry',8,230,'In a right triangle, if legs are 3 and 4, the hypotenuse is:',NULL,'5','6','7','12','A','By Pythagoras, √(9+16) = √25 = 5.'),
('math','functions',9,232,'Slope of the line through (2, 3) and (5, 9) is:',NULL,'1','2','3','6','B','(9-3)/(5-2) = 6/3 = 2.'),
('math','operations_algebraic',9,235,'Factor: x² - 9',NULL,'(x-3)(x-3)','(x+3)(x-3)','(x+9)(x-1)','(x-9)(x+1)','B','Difference of squares: (x+3)(x-3).'),
('math','functions',9,238,'Solve: x² = 49',NULL,'7','-7','±7','14','C','Square root has two solutions: ±7.'),
('math','statistics_probability',10,240,'A die is rolled. P(even) = ?',NULL,'1/3','1/2','2/3','5/6','B','Evens are 2,4,6 out of 6 = 1/2.'),
('math','functions',10,242,'If log₁₀(100) = ?',NULL,'1','2','10','100','B','10 to the power 2 is 100.'),
('math','operations_algebraic',10,245,'Solve: 2x² - 8 = 0',NULL,'±2','±4','±√2','±√8','A','x² = 4, so x = ±2.'),

-- RIT 245+ (HS)
('math','functions',11,248,'lim(x→0) (sin x)/x = ?',NULL,'0','1','∞','undefined','B','A standard limit equals 1.'),
('math','functions',11,250,'Derivative of x³ is:',NULL,'x²','2x²','3x²','3x','C','Power rule: d/dx[x³] = 3x².'),
('math','operations_algebraic',11,252,'Solve: |x - 3| = 5',NULL,'x = 8','x = -2','x = 8 or -2','no solution','C','|x-3|=5 gives x = 8 or x = -2.'),
('math','functions',12,255,'sin(30°) = ?',NULL,'1/4','1/2','√2/2','√3/2','B','sin(30°) is exactly 1/2.'),
('math','functions',12,258,'∫ 2x dx = ?',NULL,'x','x²','x² + C','2 + C','C','Antiderivative of 2x is x² + C.'),
('math','statistics_probability',12,260,'Standard deviation measures:',NULL,'central tendency','data spread','data total','frequency','B','Standard deviation measures the spread of data around the mean.'),
('math','functions',12,262,'If f(x)=eˣ, then f''(x) = ?',NULL,'eˣ','xeˣ','1','ln(x)','A','The derivative of eˣ is itself.');

-- ============================ ENGLISH ============================
INSERT INTO questions
(subject, strand, grade_band, difficulty_rit,
 question_text, passage_text, choice_a, choice_b, choice_c, choice_d, correct_answer, explanation)
VALUES
-- RIT 140-160 (K-1)
('english','vocabulary',0,140,'Which word means a baby dog?',NULL,'Kitten','Puppy','Calf','Foal','B','A puppy is a baby dog.'),
('english','language_usage',0,143,'Which word starts with the letter "B"?',NULL,'Cat','Apple','Ball','Dog','C','The word Ball starts with B.'),
('english','vocabulary',0,145,'What is the opposite of "hot"?',NULL,'Warm','Cool','Cold','Wet','C','Cold is the opposite of hot.'),
('english','language_usage',1,150,'Which is a complete sentence?',NULL,'Running fast.','The dog runs.','Big red ball.','In the park.','B','A sentence needs a subject and verb.'),
('english','vocabulary',1,155,'A "vehicle" is something you use to ___.',NULL,'eat','wear','travel','play','C','Vehicles are used for traveling.'),
('english','reading_literature',1,160,'Read: "The sun smiled at the field of flowers." This is an example of:','The sun smiled at the field of flowers.','rhyme','simile','personification','metaphor','C','Giving the sun a human action (smiling) is personification.'),

-- RIT 160-185
('english','language_usage',2,165,'Which sentence uses correct punctuation?',NULL,'Where are you going','where are you going.','Where are you going?','Where are you going!','C','Questions end with a question mark.'),
('english','vocabulary',2,170,'A "diligent" student is one who is:',NULL,'lazy','hardworking','funny','tall','B','Diligent means showing care and effort.'),
('english','reading_informational',3,175,'Cats are carnivores. This means cats eat:','Cats are carnivores.','plants','meat','only fish','everything','B','A carnivore is a meat-eater.'),
('english','language_usage',3,180,'Which is a noun?',NULL,'Quickly','Beautiful','Garden','Sing','C','Garden is a place — a noun.'),
('english','vocabulary',3,185,'"Reluctant" most nearly means:',NULL,'eager','hesitant','clever','tired','B','Reluctant means unwilling or hesitant.'),

-- RIT 185-210
('english','reading_literature',4,190,'In the sentence "Time is money", what literary device is used?','Time is money.','simile','metaphor','alliteration','onomatopoeia','B','A direct comparison without "like" or "as" is a metaphor.'),
('english','language_usage',4,195,'Which word is an adverb?',NULL,'Run','Quickly','Tall','Apple','B','Quickly describes how an action is performed.'),
('english','reading_informational',5,200,'Read the passage. What is the main idea?',
'Bees play a critical role in our food supply. They pollinate over a third of the crops humans eat. Without bees, many fruits and vegetables would become scarce.',
'Bees produce honey','Bees are dangerous','Bees are essential for food production','Bees travel long distances','C','The passage focuses on bees'' importance to food production.'),
('english','vocabulary',5,205,'"Ambiguous" means:',NULL,'clear','unclear','loud','funny','B','Ambiguous means having more than one possible meaning.'),
('english','language_usage',5,210,'Choose the correctly punctuated sentence.',NULL,'My favorite colors are red blue and green.','My favorite colors are red, blue, and green.','My favorite colors are red blue, and green','My favorite, colors are red blue and green.','B','Items in a list are separated by commas.'),

-- RIT 210-225
('english','reading_literature',6,213,'Read the passage. What does the author imply?',
'Sara opened the box slowly. Her hands trembled. The room fell silent. Whatever was inside, she knew, would change everything.',
'Sara is bored','Sara is excited and certain','Sara is nervous and unsure','Sara is angry','C','Trembling hands and silence suggest nervousness and uncertainty.'),
('english','vocabulary',6,216,'"Meticulous" means:',NULL,'careless','precise','quiet','colorful','B','Meticulous means very careful and precise.'),
('english','language_usage',7,220,'Identify the subject in: "The old wooden bridge crossed the river."',NULL,'old','wooden','bridge','river','C','The subject is what the sentence is about: the bridge.'),
('english','reading_informational',7,222,'Read: "Renewable energy reduces emissions." This statement is:',
'Renewable energy reduces emissions.',
'an opinion','a fact','a metaphor','a hyperbole','B','It is a verifiable fact, not an opinion.'),
('english','vocabulary',7,225,'A synonym for "candid" is:',NULL,'frank','sneaky','silent','curious','A','Candid means open and honest, like frank.'),

-- RIT 225-245
('english','reading_literature',8,228,'In the sentence "The wind whispered secrets," the literary device is:','The wind whispered secrets.','hyperbole','personification','simile','irony','B','The wind is given human ability to whisper.'),
('english','language_usage',8,230,'Which sentence uses parallel structure correctly?',NULL,'She likes hiking, to swim, and biking.','She likes hiking, swimming, and biking.','She likes to hike, swimming, and bikes.','She likes hike, swim, and biking.','B','All three gerunds match grammatically.'),
('english','vocabulary',8,233,'"Ephemeral" most nearly means:',NULL,'lasting','brief','beautiful','noisy','B','Ephemeral describes things that last only a short time.'),
('english','reading_informational',9,235,'According to the passage, the primary cause of decline was:',
'Studies show the population of monarch butterflies has declined sharply. Researchers attribute this primarily to habitat loss, particularly the destruction of milkweed plants.',
'pesticides','habitat loss','climate change','overharvesting','B','The passage names habitat loss as the primary cause.'),
('english','vocabulary',9,238,'"Ubiquitous" means:',NULL,'rare','everywhere','strange','old','B','Ubiquitous means present everywhere.'),
('english','language_usage',9,240,'Which sentence is in passive voice?',NULL,'The chef cooked the meal.','The meal was cooked by the chef.','Cooking the meal, the chef smiled.','The chef who cooked the meal smiled.','B','Passive voice has the subject receiving the action.'),
('english','reading_literature',10,242,'A "foil" character is one who:',NULL,'is the villain','contrasts another character','provides comic relief','narrates the story','B','A foil highlights traits of another character through contrast.'),
('english','vocabulary',10,245,'"Pragmatic" means:',NULL,'idealistic','practical','emotional','careless','B','Pragmatic refers to a practical approach.'),

-- RIT 245+
('english','reading_informational',11,248,'Identify the author''s tone in this excerpt:',
'It is hardly surprising, given the relentless inundation of trivial notifications, that genuine focus has become a vanishing commodity in modern life.',
'enthusiastic','critical','neutral','humorous','B','The diction (relentless, vanishing) carries a critical tone.'),
('english','language_usage',11,250,'Identify the error: "Neither the manager nor the employees was present."',NULL,'no error','was should be were','should be a comma after manager','neither should be either','B','With "neither/nor", the verb agrees with the nearest subject (employees, plural).'),
('english','vocabulary',11,252,'"Equivocate" means:',NULL,'to clearly state','to speak vaguely to avoid commitment','to praise','to argue','B','Equivocate means to use ambiguous language to mislead or avoid commitment.'),
('english','reading_literature',12,255,'The phrase "all the world''s a stage" is best described as:','All the world''s a stage, and all the men and women merely players.','allegory','metaphor','irony','symbolism','B','Comparing the world to a stage without "like/as" is metaphor.'),
('english','vocabulary',12,258,'"Perspicacious" means:',NULL,'short-tempered','keenly observant','wealthy','generous','B','Perspicacious means having a ready insight into things.'),
('english','reading_informational',12,260,'Which is the best inference?',
'Despite record corporate profits, real wages for the median worker have stagnated for over a decade. Economists disagree on the cause.',
'corporations are doing poorly','workers'' purchasing power has not kept pace','wages and profits are perfectly aligned','economists agree on a single cause','B','Stagnant real wages while profits rise implies purchasing power has not kept up.'),
('english','language_usage',12,262,'Choose the sentence with proper subjunctive mood:',NULL,'If I was you, I would leave.','If I were you, I would leave.','If I am you, I would leave.','If I be you, I would leave.','B','Counterfactual conditionals use "were", not "was".'),
('english','vocabulary',12,265,'A "pyrrhic" victory is one that is:',NULL,'overwhelming','won at devastating cost','easily won','disputed','B','A pyrrhic victory comes at a cost so heavy it nullifies the win.'),

-- Additional English fillers (broadly spread)
('english','vocabulary',0,147,'A "puddle" is a small pool of:',NULL,'sand','water','rocks','grass','B','A puddle is a small amount of water.'),
('english','language_usage',1,153,'Which word is a verb?',NULL,'happy','jump','blue','tree','B','Jump describes an action.'),
('english','vocabulary',1,158,'"Tiny" most nearly means:',NULL,'huge','small','quiet','clean','B','Tiny means very small.'),
('english','reading_literature',2,167,'In a story, the "setting" is the:',NULL,'main idea','time and place','characters','problem','B','Setting is when and where the story happens.'),
('english','language_usage',3,182,'Which word is an adjective?',NULL,'run','quickly','green','book','C','Green describes a noun, so it is an adjective.'),
('english','reading_informational',4,193,'A "main idea" is best described as:',NULL,'the title','the most important point','any detail','the last sentence','B','The main idea is the central point of a passage.'),
('english','language_usage',4,198,'A pronoun replaces a:',NULL,'verb','noun','adjective','adverb','B','Pronouns (he, she, it, they) replace nouns.'),
('english','reading_informational',5,204,'Which is a primary source?',NULL,'a textbook','a personal diary from 1850','a Wikipedia article','an encyclopedia','B','Primary sources are firsthand accounts.'),
('english','vocabulary',6,211,'"Benevolent" most nearly means:',NULL,'cruel','kind','quiet','rich','B','Benevolent describes a kind, well-meaning person.'),
('english','language_usage',7,218,'Identify the prepositional phrase: "The book on the shelf is mine."',NULL,'The book','on the shelf','is mine','book is','B','"On the shelf" begins with a preposition and shows location.'),
('english','reading_literature',8,231,'A protagonist is the:',NULL,'main character','villain','narrator','setting','A','The protagonist is the main character of a story.'),
('english','vocabulary',9,239,'"Convoluted" most nearly means:',NULL,'simple','complicated','rapid','cheerful','B','Convoluted means twisted or complex.'),
('english','language_usage',10,243,'A semicolon is used to:',NULL,'end every sentence','link two independent clauses','start a list','show ownership','B','A semicolon joins two related independent clauses.');
