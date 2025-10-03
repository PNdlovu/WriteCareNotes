const Sequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends Sequencer {
  sort(tests) {
    // Define test execution order
    const testOrder = [
      'unit',
      'integration', 
      'e2e',
      'services'
    ];

    const sortedTests = tests.sort((a, b) => {
      const aOrder = testOrder.findIndex(type => a.path.includes(type));
      const bOrder = testOrder.findIndex(type => b.path.includes(type));
      
      if (aOrder === -1 && bOrder === -1) return 0;
      if (aOrder === -1) return 1;
      if (bOrder === -1) return -1;
      
      return aOrder - bOrder;
    });

    return sortedTests;
  }
}

module.exports = CustomSequencer;