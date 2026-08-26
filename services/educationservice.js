const withTransaction = require('../db/transaction');
const educationRepo = require('../repositories/educationRepository');

/**
 * Saves a person's full education record, including training and expenses, in a single transaction.
 */
async function saveEducationRecord(educationData) {
    // We wrap everything inside the transaction helper
    return withTransaction(async (connection) => {
        
        // 1. Insert the main education record
        const educationResult = await educationRepo.createEducation(connection, educationData);
        const personRoundId = educationData.person_round_id;

        // 2. If training types are provided, insert them
        if (educationData.training_types && educationData.training_types.length > 0) {
            // Use Promise.all to run multiple inserts in parallel
            await Promise.all(
                educationData.training_types.map(type => 
                    educationRepo.createTraining(connection, personRoundId, type)
                )
            );
        }

        // 3. If education expenses are provided, insert them
        if (educationData.education_expenses && educationData.education_expenses.length > 0) {
            await Promise.all(
                educationData.education_expenses.map(item => 
                    educationRepo.createEducationExpense(connection, personRoundId, item.expense_item_id, item.amount)
                )
            );
        }

        // Return success message
        return { message: 'Education record saved successfully', person_round_id: personRoundId };
    });
}

module.exports = {
    saveEducationRecord
};