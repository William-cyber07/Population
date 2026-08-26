DROP DATABASE IF EXISTS mydb;
CREATE DATABASE mydb;
USE mydb;

CREATE TABLE survey_round (
    round_id        SMALLINT PRIMARY KEY,
    survey_year     SMALLINT NOT NULL,
    quarter_of_year SMALLINT NOT NULL CHECK (quarter_of_year BETWEEN 1 AND 4),
    quarter_label   VARCHAR(6) NOT NULL,         
    absolute_round  SMALLINT,                     
    UNIQUE (survey_year, quarter_of_year)
);

-- Regions --
CREATE TABLE region (
    region_id   SMALLINT PRIMARY KEY,
    region_name VARCHAR(50) NOT NULL UNIQUE
);

-- Districts --
CREATE TABLE district (
    district_id   SMALLINT PRIMARY KEY,
    region_id SMALLINT NOT NULL REFERENCES region(region_id),
    district_code VARCHAR(6) NOT NULL UNIQUE,     
    district_name VARCHAR(80)
);

-- Household roster relationship -- 
CREATE TABLE relationship_to_head (
    relationship_id SMALLINT PRIMARY KEY,
    label VARCHAR(45) NOT NULL
);

-- Marital Stat  
CREATE TABLE marital_status (
    status_id SMALLINT PRIMARY KEY,
    label VARCHAR(40) NOT NULL
);

-- level of education --
CREATE TABLE education_level (
    level_id SMALLINT PRIMARY KEY,
    label VARCHAR(60) NOT NULL
);

-- Occupation --
CREATE TABLE occupation_code (
    occupation_code_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    major_code VARCHAR(4),
    detail4_code VARCHAR(4),
    detail6_code VARCHAR(6),
    title VARCHAR(120)
);

-- Industry of current occupation
CREATE TABLE industry_code (
    industry_code_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    major_code VARCHAR(4),
    detail4_code VARCHAR(4),
    detail6_code VARCHAR(6),
    title VARCHAR(120)
);

CREATE TABLE activity_type (
    activity_type_id INT PRIMARY KEY,
    label VARCHAR(60) NOT NULL
);

CREATE TABLE expense_item(
    expense_item_id SMALLINT PRIMARY KEY,
    label VARCHAR(60) NOT NULL
);

CREATE TABLE tool_equipment (
    tool_id SMALLINT PRIMARY KEY,
    label VARCHAR(80) NOT NULL
);

CREATE TABLE workplace_condition_item (
    condition_id SMALLINT PRIMARY KEY,
    category VARCHAR(20) NOT NULL
			CHECK (category IN ('hazard','harassment','safety_measure','health_program','labour_right')),
    label VARCHAR(100) NOT NULL
);

-- Stable household identity across waves
CREATE TABLE household (
    household_id  INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    hhid          VARCHAR(10) NOT NULL UNIQUE,     
    hhold_id_alt  VARCHAR(10)
);

-- Household-level facts specific to one interview round
CREATE TABLE household_round (
    household_round_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    household_id  INT NOT NULL REFERENCES household(household_id),
    round_id SMALLINT NOT NULL REFERENCES survey_round(round_id),
    cluster VARCHAR(10), 
    region_id SMALLINT REFERENCES region(region_id),      
    district_id SMALLINT REFERENCES district(district_id), 
    urban_rural CHAR(1) CHECK (urban_rural IN ('U','R')),
    hh_weight NUMERIC(14,4), 
    UNIQUE (household_id, round_id)
);

-- Stable individual identity across waves
CREATE TABLE person (
    person_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    personid  VARCHAR(12) NOT NULL UNIQUE
);

-- THE central fact table: one row per person per interview round.
CREATE TABLE person_round (
    person_round_id INT AUTO_INCREMENT PRIMARY KEY, -- Changed from SERIAL
    person_id INT NOT NULL REFERENCES person(person_id),
    household_round_id INT NOT NULL REFERENCES household_round(household_round_id),
    sex  CHAR(1) CHECK (sex IN ('M','F')),
    relationship_id SMALLINT REFERENCES relationship_to_head(relationship_id),
    date_of_birth DATE,
    age_years SMALLINT,
    age_months SMALLINT,
    marital_status_id SMALLINT REFERENCES marital_status(status_id), 
    religion VARCHAR(60),
    nationality VARCHAR(60),
    ethnicity_major VARCHAR(60),
    ethnicity_detail VARCHAR(60),
    pop_weight NUMERIC(14,4),
    available_for_interview BOOLEAN DEFAULT TRUE,
    unavailable_reason VARCHAR(100),
    UNIQUE (person_id, household_round_id)
);

-- migration history 
CREATE TABLE migration_history (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    born_in_this_town BOOLEAN,
    born_region_id SMALLINT REFERENCES region(region_id),
    born_district_id SMALLINT REFERENCES district(district_id),
    resident_since_birth BOOLEAN,
    years_in_town NUMERIC(5,1),
    prior_residence_type VARCHAR(60),
    prior_region_id SMALLINT REFERENCES region(region_id),
    years_at_prior_residence NUMERIC(5,1),
    reason_for_moving VARCHAR(100)
);

-- Education
CREATE TABLE education (
    person_round_id  INT PRIMARY KEY REFERENCES person_round(person_round_id),
    ever_attended_school BOOLEAN,
    reason_never_attended VARCHAR(100),
    highest_level_id SMALLINT REFERENCES education_level(level_id),
    highest_grade_completed VARCHAR(30),
    attended_past_3_months BOOLEAN,
    still_in_school BOOLEAN,
    school_type VARCHAR(20),
    commute_mode_from VARCHAR(40),
    commute_mode_to VARCHAR(40),
    commute_minutes SMALLINT,
    expense_payer VARCHAR(60),
    received_scholarship BOOLEAN,
    scholarship_amount NUMERIC(10,2),
    currently_in_training BOOLEAN,
    training_expense_amount NUMERIC(10,2)
);

CREATE TABLE person_round_training (
    person_round_id INT NOT NULL REFERENCES person_round(person_round_id),
    training_type VARCHAR(30) NOT NULL,
    PRIMARY KEY (person_round_id, training_type)
);
 
CREATE TABLE person_round_education_expense (
    person_round_id INT NOT NULL REFERENCES person_round(person_round_id),
    expense_item_id SMALLINT NOT NULL REFERENCES expense_item(expense_item_id),
    amount NUMERIC(10,2),
    PRIMARY KEY (person_round_id, expense_item_id)
); 

CREATE TABLE apprenticeship (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    is_apprentice BOOLEAN,
    duration_years SMALLINT,
    duration_months SMALLINT,
    trade VARCHAR(80),
    trade_code VARCHAR(10)
);

-- Health
CREATE TABLE health_episode (
    person_round_id  INT PRIMARY KEY REFERENCES person_round(person_round_id),
    illness_or_injury_2wk BOOLEAN,
    days_ill SMALLINT,
    stopped_usual_activities BOOLEAN,
    days_activity_stopped SMALLINT,
    consulted_practitioner BOOLEAN,
    consulted_whom VARCHAR(60),
    main_reason_for_visit VARCHAR(100),
    facility_group VARCHAR(60),
    facility_name VARCHAR(100),
    facility_code VARCHAR(20),
    fee_registration NUMERIC(10,2),
    fee_consultation NUMERIC(10,2),
    fee_diagnosis NUMERIC(10,2),
    fee_drugs_treatment NUMERIC(10,2),
    fee_overall_treatment NUMERIC(10,2), 
    fee_other_services NUMERIC(10,2),
    fee_travel NUMERIC(10,2),
    admitted_hospital_2wk BOOLEAN,
    nights_in_hospital SMALLINT,
    fee_hospital_stay NUMERIC(10,2),
    bought_medicine BOOLEAN,
    fee_medicine NUMERIC(10,2),
    total_medical_expense NUMERIC(10,2),
    admitted_hospital_3mo BOOLEAN,
    expense_admission_3mo NUMERIC(10,2),
    main_expense_payer VARCHAR(60)
);

CREATE TABLE health_insurance_anthropometry (
    person_round_id  INT PRIMARY KEY REFERENCES person_round(person_round_id),
    ever_registered_insurance  BOOLEAN,
    currently_covered BOOLEAN,
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    measurement_mode VARCHAR(30),
    bmi NUMERIC(5,2)
);
 
CREATE TABLE disability (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    difficulty_seeing VARCHAR(20),
    dificulty_hearing VARCHAR(20),
    difficulty_walking VARCHAR(20),
    difficulty_remembering VARCHAR(20),
    difficulty_selfcare VARCHAR(20),
    difficulty_communications VARCHAR(20)
);
 
-- LABOUR / EMPLOYMENT 
CREATE TABLE employment_current (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    any_activity_past_7d  BOOLEAN,
    reason_no_activity VARCHAR(100),
    ocupation_code_id INT REFERENCES occupation_code(occupation_code_id),
    industry_code_id INT REFERENCES industry_code(industry_code_id),
    sector VARCHAR(30),
    tenure_duration VARCHAR(20),
    work_location VARCHAR(60),
    employment_regularity VARCHAR(20),
    job_status VARCHAR(40),
    has_contract BOOLEAN
);

SELECT 
    person_round_id,
    person_id,
    household_round_id,
    sex,
    age_years,
    pop_weight
FROM person_round;

-- 1. Create a survey round (required for the next step)
-- 1. Create a survey round (skips if round_id 1 already exists)
INSERT IGNORE INTO survey_round (round_id, survey_year, quarter_of_year, quarter_label)
VALUES (1, 2024, 1, '2024Q1');

-- 2. Create a household (skips if HH001 already exists)
INSERT IGNORE INTO household (hhid) VALUES ('HH001');

-- 3. Create a household_round record 
-- (This will still error if you run it twice because household_round_id is auto-increment,
-- but the first time you run it, it will succeed).
INSERT INTO household_round (household_id, round_id, cluster, urban_rural)
VALUES (1, 1, 'CLUSTER_01', 'U');

-- Seed the relationship_to_head table
INSERT IGNORE INTO relationship_to_head (relationship_id, label) VALUES
(1, 'Head'),
(2, 'Spouse (wife/husband/living together)'),
(3, 'Child (son/daughter)'),
(4, 'Parent'),
(5, 'Parent-in-law'),
(6, 'Son-in-law'),
(7, 'Daughter-in-law'),
(8, 'Grandchild'),
(9, 'Great grandchild'),
(10, 'Brother/Sister'),
(11, 'Step child'),
(12, 'Foster child'),
(13, 'Adopted child'),
(14, 'Other relative'),
(15, 'Non relative'),
(16, 'Househelp'),
(17, 'Not member anymore');

-- Seed the marital_status table
	INSERT IGNORE INTO marital_status (status_id, label) VALUES
	(1, 'Informal/living together'),
	(2, 'Married (Civil/Ordinance)'),
	(3, 'Married (Customary/Traditional)'),
	(4, 'Married (Islamic)'),
	(5, 'Married (Other type)'),
	(6, 'Separated'),
	(7, 'Divorced'),
	(8, 'Widowed'),
	(9, 'Never married');
    
    INSERT IGNORE INTO activity_type (activity_type_id, label) VALUES
(1, 'Wage work'),
(2, 'Domestic work'),
(3, 'Farm enterprise work'),
(4, 'Non-farm enterprise work'),
(5, 'Family help work'),
(6, 'Non-productive agriculture / fishing / gathering'),
(7, 'Apprenticeship work'),
(8, 'Voluntary work');

ALTER TABLE person_round DROP FOREIGN KEY person_round_ibfk_1;
SELECT * FROM person_round WHERE person_round_id = 2;

-- Create the Secondary Job table
CREATE TABLE IF NOT EXISTS employment_secondary_job (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    job_count SMALLINT,
    occupation_code_id INT REFERENCES occupation_code(occupation_code_id),
    industry_code_id INT REFERENCES industry_code(industry_code_id),
    days_worked SMALLINT,
    sector VARCHAR(30),
    job_status VARCHAR(40),
    payment_basis VARCHAR(20),
    payment_amount NUMERIC(12,2),
    payment_unit VARCHAR(20),
    receives_in_kind BOOLEAN,
    in_kind_value NUMERIC(12,2),
    in_kind_unit VARCHAR(20),
    has_contract BOOLEAN,
    entitled_paid_leave BOOLEAN,
    entitled_sick_maternity_leave BOOLEAN,
    entitled_social_security BOOLEAN,
    social_security_scheme VARCHAR(60),
    entitled_subsidized_medical BOOLEAN,
    work_location VARCHAR(60),
    employment_regularity VARCHAR(20)
);

-- Create the Secondary Job Daily Hours table
CREATE TABLE IF NOT EXISTS person_round_secondary_job_dev (
    person_round_id INT NOT NULL,
    day_number SMALLINT NOT NULL CHECK (day_number BETWEEN 1 AND 7),
    hours_worked NUMERIC(4,1),
    PRIMARY KEY (person_round_id, day_number),
    FOREIGN KEY (person_round_id) REFERENCES employment_secondary_job(person_round_id) ON DELETE CASCADE
);

-- Make the secondary job status column bigger
ALTER TABLE employment_secondary_job MODIFY job_status VARCHAR(80);

-- Also fix the main employment table, because it has the exact same limit!
ALTER TABLE employment_current MODIFY job_status VARCHAR(80);

INSERT IGNORE INTO workplace_condition_item (condition_id, category, label) VALUES
(1, 'hazard', 'Dust, fumes'),
(2, 'hazard', 'Fire, gas, flames'),
(3, 'hazard', 'Loud noise or vibration'),
(4, 'hazard', 'Extreme cold or heat'),
(5, 'hazard', 'Dangerous tools (knives etc)'),
(6, 'hazard', 'Work underground'),
(7, 'hazard', 'Work at heights'),
(8, 'hazard', 'Work in water/lake/pond/river'),
(9, 'hazard', 'Workplace too dark or confined'),
(10, 'hazard', 'Insufficient ventilation'),
(11, 'hazard', 'Chemicals (pesticides, glues, etc.)'),
(12, 'hazard', 'Explosives'),
(13, 'hazard', 'Narcotic drugs'),
(14, 'hazard', 'Arms (guns)'),
(15, 'harassment', 'Constantly shouted at'),
(16, 'harassment', 'Repeatedly insulted'),
(17, 'harassment', 'Beaten /physically hurt'),
(18, 'harassment', 'Sexually harassed'),
(19, 'safety_measure', 'Posting of safety signages or warnings'),
(20, 'safety_measure', 'Installation of machine guards'),
(21, 'labour_right', 'Freedom of association'),
(22, 'labour_right', 'Effective recognition of the rights to collective bargaining'),
(23, 'labour_right', 'Minimum wage salary'),
(24, 'labour_right', 'Elimination of discrimination in respect of employment');

-- 1. Underemployment Table
CREATE TABLE IF NOT EXISTS underemployment (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    total_hours_worked NUMERIC(5,1),
    available_more_hours BOOLEAN, 
    willing_more_hours BOOLEAN, 
    wants_different_or_additional_job BOOLEAN,
    sought_job_change BOOLEAN, 
    reason_sought_change VARCHAR(100),
    steps_taken VARCHAR(100), 
    ready_for_change BOOLEAN
);

-- 2. Employment 12-Month History Table
CREATE TABLE IF NOT EXISTS employment_12month (
    person_round_id INT PRIMARY KEY REFERENCES person_round(person_round_id),
    worked_past_12mo BOOLEAN,
    same_as_main_job BOOLEAN,
    occupation_code_id INT,
    industry_code_id INT REFERENCES industry_code(industry_code_id),
    job_status VARCHAR(40), 
    sector VARCHAR(30), 
    received_payment BOOLEAN
);

-- 3. Job Search Table
CREATE TABLE IF NOT EXISTS job_search (
    person_round_id  INT PRIMARY KEY REFERENCES person_round(person_round_id),
    available_past_7d BOOLEAN,
    made_effort_to_find_work BOOLEAN, 
    reason_no_effort VARCHAR(100), 
    method_used VARCHAR(100), 
    willing_part_time BOOLEAN, 
    employment_sought VARCHAR(60), 
    weeks_seeking NUMERIC(5,1),
    occupation_code_id INT REFERENCES occupation_code(occupation_code_id), 
    min_acceptable_wage NUMERIC(12,2),
    min_wage_unit VARCHAR(20), 
    reason_unavailable VARCHAR(100), 
    conditions_to_accept_work VARCHAR(100), 
    ever_refused_job BOOLEAN, 
    reason_refused VARCHAR(100), 
    reason_not_getting_job VARCHAR(100) 
);

-- 4. Workplace Safety Tables (Parent and Child)
CREATE TABLE IF NOT EXISTS workplace_safety (
    person_round_id  INT PRIMARY KEY REFERENCES person_round(person_round_id),    
    had_work_injury_illness BOOLEAN, 
    work_stopped_due_to_injury BOOLEAN,
    has_safety_officer BOOLEAN, 
    safety_officer_accredited BOOLEAN,
    aware_of_labour_rights BOOLEAN
);

CREATE TABLE IF NOT EXISTS person_round_workplace_condition (
    person_round_id INT NOT NULL REFERENCES person_round(person_round_id),
    condition_id SMALLINT NOT NULL REFERENCES workplace_condition_item(condition_id),
    PRIMARY KEY (person_round_id, condition_id)
);

INSERT IGNORE INTO relationship_to_head (relationship_id, label) VALUES 
(1, 'Head'),
(2, 'Spouse (wife/husband/living together)'),
(3, 'Child (son/daughter)'),
(4, 'Parent'),
(5, 'Parent-in-law'),
(6, 'Son-in-law'),
(7, 'Daughter-in-law'),
(8, 'Grandchild'),
(9, 'Great grandchild'),
(10, 'Brother/Sister'),
(11, 'Step child'),
(12, 'Foster child'),
(13, 'Adopted child'),
(14, 'Other relative'),
(15, 'Non relative'),
(16, 'Househelp'),
(17, 'Not member anymore');

-- 1. Select the correct database
USE mydb;

-- 2. Insert the survey round
INSERT IGNORE INTO survey_round (round_id, survey_year, quarter_of_year, quarter_label)
VALUES (1, 2024, 1, '2024Q1');

-- 3. Insert the household
INSERT IGNORE INTO household (hhid) VALUES ('HH001');

-- 4. Insert the household_round (This is the foreign key the backend is waiting for!)
INSERT IGNORE INTO household_round (household_id, round_id, cluster, urban_rural)
VALUES (1, 1, 'CLUSTER_01', 'U');

SELECT * FROM household_round;

SELECT * FROM person_round;

SELECT 
    pr.person_round_id, 
    p.personid, 
    pr.sex, 
    pr.age_years 
FROM person_round pr 
JOIN person p ON pr.person_id = p.person_id;

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'field_user') NOT NULL DEFAULT 'field_user',
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add a default Admin account (password is: admin123)
-- Note: We will update this with a hashed password in the next step, but this gives us a test account to work with.
INSERT INTO users (username, password_hash, role, full_name) 
VALUES ('admin', 'admin123', 'admin', 'System Administrator');

-- 3. Add a default Field User account (password is: user123)
INSERT INTO users (username, password_hash, role, full_name) 
VALUES ('fielduser', 'user123', 'field_user', 'Field Worker 1');

-- Add the missing columns to the person_round table
ALTER TABLE person_round 
ADD COLUMN status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN created_by INT;

-- Then, verify the columns were added successfully
DESCRIBE person_round;

-- Link the created_by column to the users table
ALTER TABLE person_round 
ADD CONSTRAINT fk_person_round_created_by 
FOREIGN KEY (created_by) REFERENCES users(user_id);

INSERT INTO person_round (person_round_id, person_id, household_round_id, sex, relationship_id, age_years, status, created_by) 
VALUES (99, 2, 1, 'M', 1, 30, 'draft', 2);

INSERT INTO person_round (person_round_id, person_id, household_round_id, sex, relationship_id, age_years, status, created_by) 
VALUES (98, 3, 1, 'M', 1, 40, 'pending_review', 2);

-- 1. Add the column to track which Admin reviewed the survey
ALTER TABLE person_round 
ADD COLUMN reviewed_by INT,
ADD COLUMN rejection_reason VARCHAR(255);

-- 2. Link the reviewed_by column to the users table (optional but recommended)
ALTER TABLE person_round 
ADD CONSTRAINT fk_person_round_reviewed_by 
FOREIGN KEY (reviewed_by) REFERENCES users(user_id);

DESCRIBE person_round;

INSERT IGNORE INTO survey_round (round_id, survey_year, quarter_of_year, quarter_label) 
VALUES (1, 2024, 1, '2024Q1');

ALTER TABLE region MODIFY region_id SMALLINT AUTO_INCREMENT;

-- 1. Fix the Region table auto-increment
ALTER TABLE region MODIFY COLUMN region_id SMALLINT AUTO_INCREMENT;

-- 2. Fix the District table auto-increment
ALTER TABLE district MODIFY COLUMN district_id SMALLINT AUTO_INCREMENT;

-- 1. Fix the district_code column so it accepts NULL values (allowing us to skip it)
ALTER TABLE district MODIFY COLUMN district_code VARCHAR(10) NULL;

INSERT INTO district (district_name, region_id) VALUES ('Ablekuma Central Municipal Assembly', 1);

-- Update the admin password (admin123)
UPDATE users SET password_hash = 'admin123' WHERE username = 'admin';

-- Update the field user password (user123)
UPDATE users SET password_hash = 'user123' WHERE username = 'fielduser';

SELECT username, password_hash FROM users;

-- Add the missing column to the users table
ALTER TABLE users ADD COLUMN assigned_district_id SMALLINT;

UPDATE users SET password_hash = 'admin123' WHERE username = 'admin';

UPDATE users SET password_hash = '$2a$10$ZyUPT6DnF5s9s8wCpbWXz.kzYh6uDy3p6bY4M3M7K7L8L9M9N1' WHERE username = 'fielduser';

ALTER TABLE education_level MODIFY level_id SMALLINT AUTO_INCREMENT;