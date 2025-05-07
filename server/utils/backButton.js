// Utility function to create a Back to Admin Panel button
const createBackButton = () => ({
  text: '⬅️ Back to Admin Panel',
  callback_data: 'back_to_admin_panel',
});

module.exports = {
  createBackButton
};
