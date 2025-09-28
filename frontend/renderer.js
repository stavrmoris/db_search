const { createApp, nextTick } = Vue

createApp({
  data() {
    return {
      // Состояние аутентификации
      currentUser: null,
      users: [],
      loadingUsers: true,
      userFetchError: null,
      userSearchQuery: '',

      // Состояние чата
      query: "",
      chatHistory: [],
      activeResult: null,
      loading: false,
      chartInstance: null,
      suggestions: [
        'Покажи мои задачи',
        'Сколько задач в каждом статусе?',
        'Какие задачи просрочены?'
      ],

      // Состояние показа результатов
      displayedResults: [],
      pageSize: 50,
      isTruncated: false,
    }
  },
  computed: {
    filteredUsers() {
      if (!this.userSearchQuery) {
        return this.users;
      }
      const query = this.userSearchQuery.toLowerCase();
      return this.users.filter(user => {
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        return fullName.includes(query);
      });
    }
  },
  methods: {
    // --- МЕТОДЫ ДЛЯ ВЫБОРА ПОЛЬЗОВАТЕЛЯ ---
    async fetchUsers() {
      try {
        this.loadingUsers = true;
        this.userFetchError = null;
        const response = await fetch("https://db.moriscode.ru/users");
        if (!response.ok) {
          throw new Error('Не удалось загрузить список сотрудников. Убедитесь, что бэкенд запущен.');
        }
        this.users = await response.json();
      } catch (error) {
        this.userFetchError = error.message;
      } finally {
        this.loadingUsers = false;
      }
    },

    selectUser(user) {
      this.currentUser = user;
      this.chatHistory = [
        { sender: 'assistant', content: `Здравствуйте, ${this.currentUser.first_name}! Чем могу помочь?` }
      ];
      this.activeResult = null;
      this.displayedResults = [];
      this.isTruncated = false;
    },

    logout() {
      this.currentUser = null;
      this.userSearchQuery = '';
      this.fetchUsers();
    },


    async sendMessage() {
      const userQuery = this.query.trim();
      if (!userQuery || this.loading || !this.currentUser) return;

      this.chatHistory.push({ sender: 'user', content: userQuery });
      this.query = "";
      this.loading = true;
      this.scrollToBottom();

      this.chatHistory.push({ sender: 'assistant', content: '...', thinking: true });
      this.scrollToBottom();

      try {
        const res = await fetch("https://db.moriscode.ru/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: this.currentUser.id, text: userQuery })
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail?.error || `Ошибка сети: ${res.statusText}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const displayType = this.determineDisplayType(data);

        if (data.result && data.result.length > this.pageSize) {
            this.displayedResults = data.result.slice(0, this.pageSize);
            this.isTruncated = true;
        } else {
            this.displayedResults = data.result || [];
            this.isTruncated = false;
        }

        const summary = this.createSummary(data);

        const lastMessage = this.chatHistory[this.chatHistory.length - 1];
        lastMessage.thinking = false;
        lastMessage.content = summary;

        this.activeResult = { ...data, displayType };
        this.renderVisualization();

      } catch (e) {
        const lastMessage = this.chatHistory[this.chatHistory.length - 1];
        lastMessage.thinking = false;
        lastMessage.content = `Произошла ошибка: ${e.message}`;
        this.activeResult = null;
      } finally {
        this.loading = false;
        this.scrollToBottom();
      }
    },

    loadMoreResults() {
        if (!this.activeResult || !this.isTruncated) return;

        const currentLength = this.displayedResults.length;
        const nextResults = this.activeResult.result.slice(currentLength, currentLength + this.pageSize);
        this.displayedResults.push(...nextResults);

        if (this.displayedResults.length >= this.activeResult.result.length) {
            this.isTruncated = false;
        }
    },

    determineDisplayType(data) {
        if (!data.result || data.result.length === 0) return 'table';

        const firstRow = data.result[0];
        const columns = Object.keys(firstRow);

        if (data.result.length === 1 && columns.length === 1) {
            return 'kpi';
        }

        if (columns.length === 2 && (columns.some(c => c.toLowerCase().includes('count')) || columns.some(c => c.toLowerCase().includes('total')))) {
            return 'chart';
        }

        if (columns.includes('title') && (columns.includes('status') || columns.includes('priority'))) {
            return 'cards';
        }

        return 'table';
    },

    createSummary(data) {
        if (!data.result || data.result.length === 0) {
            return "Я ничего не нашел по вашему запросу.";
        }
        const count = data.result.length;
        let recordsWord = "записей";
        const lastDigit = count % 10;
        const lastTwoDigits = count % 100;

        if (lastDigit === 1 && lastTwoDigits !== 11) {
            recordsWord = "запись";
        } else if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
            recordsWord = "записи";
        }

        let summaryText = `Отлично, я нашел ${count} ${recordsWord}. `;
        if(this.isTruncated) {
            summaryText += `Первые ${this.pageSize} отображены справа.`
        } else {
            summaryText += `Результаты отображены справа.`
        }
        return summaryText;
    },

    renderVisualization() {
        if (!this.activeResult || !this.activeResult.result || this.activeResult.result.length === 0) return;

        nextTick(() => {
            if (this.chartInstance) {
                this.chartInstance.destroy();
                this.chartInstance = null;
            }

            if (this.activeResult.displayType === 'chart') {
                const ctx = document.getElementById('resultChart');
                if (!ctx) return;

                const labels = this.activeResult.result.map(row => row[Object.keys(row)[0]]);
                const data = this.activeResult.result.map(row => row[Object.keys(row)[1]]);

                this.chartInstance = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Количество',
                            data: data,
                            backgroundColor: 'rgba(59, 130, 246, 0.5)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1,
                            borderRadius: 5,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: Math.ceil(Math.max(...data) / 10) < 1 ? 1 : undefined
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
            }
        });
    },

    applySuggestion(suggestion) {
        this.query = suggestion;
        this.sendMessage();
    },

    scrollToBottom() {
      nextTick(() => {
        const chatLog = this.$refs.chatLog;
        if (chatLog) {
            chatLog.scrollTop = chatLog.scrollHeight;
        }
      });
    }
  },
  mounted() {
    this.fetchUsers();
  }
}).mount('#app');