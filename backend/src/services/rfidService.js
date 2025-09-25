class RfidService {
  static generateCardId() {
    const prefix = 'RF';
    const randomNum = Math.random().toString().slice(2, 8);
    return prefix + randomNum;
  }

  static async simulateCardDetection() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cardId: this.generateCardId(),
          detected: true,
          timestamp: new Date()
        });
      }, 2000);
    });
  }

  static validateCardFormat(cardId) {
    return /^RF\d{6}$/.test(cardId);
  }
}

module.exports = RfidService;
