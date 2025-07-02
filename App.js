import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, UIManager, Platform, LayoutAnimation,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [dark, setDark] = useState(false);

  // DateTime picker states
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [pickerMode, setPickerMode] = useState('date'); // 'date' or 'time'

  useEffect(() => {
    AsyncStorage.getItem('tasks').then(saved => saved && setTasks(JSON.parse(saved)));
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!text.trim()) return;
    const now = new Date().toISOString();
    LayoutAnimation.easeInEaseOut();
    setTasks(t => [...t, { id: Date.now().toString(), title: text.trim(), done: false, datetime: now, completedAt: null }]);
    setText('');
  };

  const toggle = id => {
    LayoutAnimation.easeInEaseOut();
    setTasks(t =>
      t.map(task => {
        if (task.id === id) {
          const done = !task.done;
          return { ...task, done, completedAt: done ? new Date().toISOString() : null };
        }
        return task;
      })
    );
  };

  const remove = id => {
    LayoutAnimation.easeInEaseOut();
    setTasks(t => t.filter(task => task.id !== id));
  };

  const clearCompleted = () => {
    LayoutAnimation.easeInEaseOut();
    setTasks(t => t.filter(task => !task.done));
  };

  const openDatePicker = (task) => {
    setEditingTaskId(task.id);
    setPickerDate(new Date(task.datetime));
    setPickerMode('date');
    setPickerVisible(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setPickerVisible(false);
      setEditingTaskId(null);
      return;
    }

    if (pickerMode === 'date') {
      const currentDate = selectedDate || pickerDate;
      setPickerDate(currentDate);
      setPickerMode('time');
      setPickerVisible(true); // reopen for time picking
    } else if (pickerMode === 'time') {
      const currentDate = pickerDate;

      // Combine date from pickerDate + time from selectedDate
      const combined = new Date(currentDate);
      combined.setHours(selectedDate.getHours());
      combined.setMinutes(selectedDate.getMinutes());
      combined.setSeconds(0);
      combined.setMilliseconds(0);

      setTasks(t =>
        t.map(task => (task.id === editingTaskId ? { ...task, datetime: combined.toISOString() } : task))
      );

      setPickerVisible(false);
      setEditingTaskId(null);
    }
  };

  const filteredTasks = tasks.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  );

  const formatDateTime = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.container, dark ? styles.darkBg : styles.lightBg]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>📝 To-Do List</Text>
        <TouchableOpacity onPress={() => setDark(d => !d)} style={styles.themeToggle}>
          <Text style={{ fontSize: 24 }}>{dark ? '🌙' : '☀️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {['all', 'active', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
            style={[
              styles.filterBtn,
              dark ? styles.filterBtnDark : styles.filterBtnLight,
              filter === f && (dark ? styles.activeFilterDark : styles.activeFilterLight),
            ]}
          >
            <Text style={[
              styles.filterText,
              filter === f ? styles.activeFilterText : (dark ? styles.textLight : styles.textDark)
            ]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clear Completed */}
      {filter === 'completed' && tasks.some(t => t.done) && (
        <TouchableOpacity
          onPress={clearCompleted}
          style={[styles.clearBtn, dark ? styles.clearBtnDark : styles.clearBtnLight]}
          activeOpacity={0.8}
        >
          <Text style={styles.clearText}>🧹 Clear Completed</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
{filter === 'all' && (
  <View style={styles.inputRow}>
    <TextInput
      style={[styles.input, dark ? styles.inputDark : styles.inputLight]}
      placeholder="Add new task"
      placeholderTextColor={dark ? '#888' : '#aaa'}
      value={text}
      onChangeText={setText}
      onSubmitEditing={addTask}
      returnKeyType="done"
    />
    <TouchableOpacity
      onPress={addTask}
      style={[styles.addBtn, dark ? styles.addBtnDark : styles.addBtnLight]}
      activeOpacity={0.8}
    >
      <Text style={styles.addBtnText}>＋</Text>
    </TouchableOpacity>
  </View>
)}


      {/* Task List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.task,
              dark ? styles.taskDark : styles.taskLight,
              item.done && styles.taskDone,
            ]}
          >
            <TouchableOpacity onPress={() => toggle(item.id)} style={{ flex: 1 }} activeOpacity={0.6}>
              <Text style={[dark ? styles.textLight : styles.textDark, item.done && styles.textDone]}>
                {item.title}
              </Text>
            </TouchableOpacity>

            {/* Date and calendar icon */}
            {filter === 'all' && (
              <TouchableOpacity
                onPress={() => openDatePicker(item)}
                style={[styles.dateBtn, dark ? styles.inputDark : styles.inputLight]}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name="calendar-today"
                  size={16}
                  color={dark ? '#ddd' : '#555'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[dark ? styles.textLight : styles.textDark, { fontSize: 13 }]}>
                  {formatDateTime(item.datetime)}
                </Text>
              </TouchableOpacity>
            )}

            {/* ACTIVE: readonly date */}
            {filter === 'active' && (
              <View style={styles.dateReadonly}>
                <MaterialIcons name="access-time" size={16} color={dark ? '#ddd' : '#555'} />
                <Text style={[styles.dateText, dark ? styles.textLight : styles.textDark]}>
                  {formatDateTime(item.datetime)}
                </Text>
              </View>
            )}

            {/* COMPLETED: show completed date + delete */}
            {filter === 'completed' && (
              <>
                <View style={styles.dateReadonly}>
                  <MaterialIcons name="check-circle" size={16} color={dark ? '#64b5f6' : '#2979FF'} />
                  <Text style={[styles.dateText, dark ? styles.textLight : styles.textDark]}>
                    Completed: {formatDateTime(item.completedAt)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => remove(item.id)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Text style={styles.deleteText}>❌</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      />

      {/* Date Picker */}
      {pickerVisible && (
        <DateTimePicker
          value={pickerDate}
          mode={pickerMode}
          display="default"
          onChange={onDateChange}
          minimumDate={new Date(2000, 0, 1)}
          maximumDate={new Date(2100, 11, 31)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 64, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center',
    borderBottomWidth: 1, borderColor: '#ccc', paddingBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700' },
  themeToggle: { padding: 8, borderRadius: 20 },

  filterRow: {
    flexDirection: 'row', justifyContent: 'center', marginBottom: 20,
    borderRadius: 30, overflow: 'hidden',
  },
  filterBtn: {
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 30, borderWidth: 1,
    marginHorizontal: 6, elevation: 3,
  },
  filterBtnLight: { backgroundColor: '#fafafa', borderColor: '#ddd' },
  filterBtnDark: { backgroundColor: '#222', borderColor: '#444' },
  activeFilterLight: { backgroundColor: '#2979FF', borderColor: '#2979FF' },
  activeFilterDark: { backgroundColor: '#64b5f6', borderColor: '#64b5f6' },
  filterText: { fontSize: 15, fontWeight: '600', color: '#666' },
  activeFilterText: { color: '#fff' },

  clearBtn: {
    alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 38,
    borderRadius: 30, marginBottom: 24, elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  clearBtnLight: { backgroundColor: '#2979FF' },
  clearBtnDark: { backgroundColor: '#64b5f6' },
  clearText: { color: 'white', fontWeight: '700', fontSize: 17 },

  inputRow: { flexDirection: 'row', marginBottom: 24 },
  input: {
    flex: 1, borderRadius: 30, paddingHorizontal: 24, paddingVertical: 14,
    fontSize: 17, borderWidth: 1,
  },
  inputLight: { backgroundColor: '#fff', borderColor: '#ddd', color: '#222' },
  inputDark: { backgroundColor: '#222', borderColor: '#444', color: '#eee' },

  addBtn: {
    marginLeft: 14, width: 54, height: 54, borderRadius: 27,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5, shadowOffset: { width: 0, height: 3 },
  },
  addBtnLight: { backgroundColor: '#2979FF' },
  addBtnDark: { backgroundColor: '#64b5f6' },
  addBtnText: { color: 'white', fontSize: 34, lineHeight: 36, fontWeight: 'bold' },

  task: {
    flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 22, borderRadius: 24,
    marginBottom: 16, alignItems: 'center', elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  taskLight: { backgroundColor: '#fff' },
  taskDark: { backgroundColor: '#222' },
  taskDone: { opacity: 0.45 },

  textDark: { color: '#222', fontWeight: '600' },
  textLight: { color: '#eee', fontWeight: '600' },
  textDone: { textDecorationLine: 'line-through', color: '#999' },

  dateBtn: {
    marginLeft: 16, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    marginLeft: 8,
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
    fontWeight: '500',
  },

  dateReadonly: {
    marginLeft: 16, flexDirection: 'row', alignItems: 'center'
  },

  deleteBtn: { marginLeft: 16, padding: 6 },
  deleteText: { fontSize: 22, color: '#e53935' },

  darkBg: { backgroundColor: '#121212' },
  lightBg: { backgroundColor: '#fefefe' },
});
